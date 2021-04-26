'use strict';
const express = require ('express');
const server = express ();
require('dotenv').config();
const PORT = process.env.PORT
server.set ('view engine','ejs')
server.use('/public',express.static('public'));
const cors = require ('cors')
server.use(express.urlencoded({ extended: true }));
server.use (cors())
const superagent = require ('superagent');
const pg = require('pg')
const client = new pg.Client({ connectionString: process.env.DATABASE_URL,
       ssl: { rejectUnauthorized: false }
     });
const methodOverride = require ('method-override');
server.use(methodOverride('_method'));


server.get ('/', homeHandler)
function homeHandler (req,res){
    let url =`https://api.covid19api.com/world/total`;
    superagent.get(url).then(data=>{
        res.render('pages/index',{data: data.body})
    })
}

server.post ('/country', countryHandler)
function countryHandler (req,res){
    let url = `https://api.covid19api.com/country/${req.body.country}/status/confirmed?from=${req.body.date}T00:00:00Z&to=2020-01-01T00:00:00Z`
    superagent.get(url).then(data=>{
        res.render ('pages/getCountryResult',{data : data.body})
    })
}



server.get ('/all', allHandler)
function allHandler (req,res){
    let url =`https://api.covid19api.com/summary`;
    superagent.get(url).then(result=>{
        let obj = result.body.Countries
       let o =  obj.map (item=>{
            return new Card (item);
        })
        console.log (o)
        res.render('pages/All Countries', {data : o});
    })
}

server.post ('/add', addHandler)
function addHandler (req,res){
    let sql = `INSERT INTO data (country,confirmed,deaths,recovered,date) VALUES ($1,$2,$3,$4,$5) RETURNING*;`;
    let safe = req.body;
    let safeValues =[ safe.country, safe.confirmed, safe.deaths, safe.recovered, safe.date];
    client.query (sql,safeValues).then(()=>{
        res.redirect ('/all')
    })
}

server.get ('/records' , recordsHandler)
function recordsHandler (req, res){
    let sql = `SELECT * FROM data;`;
    client.query (sql).then (results=>{
        res.render ('pages/My Records' , {card : results.rows})
    })
}

server.get ('/details/:id' , detailsHandler)
function detailsHandler (req,res){
    let id = req.params.id;
    let sql = `SELECT * FROM data WHERE id=$1;`;
    let safeValues =[id];
    client.query (sql,safeValues).then(result=>{
        res.render('pages/details',{item : result.rows[0]})
    })
}

server.put ('/details/:id' , updateHandler)
function updateHandler (req,res){
    let sql = `UPDATE data SET country=$1, confirmed=$2, deaths=$3, recovered=$4, date=$5;`;
    let safe = req.body;
    let safeValues =[safe.country, safe.confirmed, safe.deaths, safe.recovered, safe.date];
    client.query (sql,safeValues).then(()=>{
        res.redirect (`/details/${req.params.id}`)
    })
}

server.delete ('/details/:id', deleteHandler)
function deleteHandler (req,res){
    let sql = `DELETE FROM data WHERE id=$1;`;
    let safe = [req.params.id];
    client.query (sql,safe).then(()=>{
        res.redirect ('/records')
    })
}

function Card (data){
    this.country = data.Country;
    this.confirmed = data.TotalConfirmed;
    this.deaths= data.TotalDeaths;
    this.recovered = data.TotalRecovered;
    this.date =data.Date;
}






client.connect ().then (()=>{
    server.listen (PORT,()=>{
        console.log (`listening 0n PORT:${PORT}`)
    })
})
