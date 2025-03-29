// leo el csv y a partir de cada valor, genero un objeto con el modelo y el precio
// y lo guardo en un array.
// luego recorro nuevamente ese array de objetos y saco promedio de los precios de los modelos repetidos, que vuelven a ser guardados en un segundo array para luego ser exportados a odoo

// Importing modules
// Scraping related modules
import axios from 'axios';
import * as cheerio from 'cheerio';
// Dotenv for environment variables
import 'dotenv/config';
// CSV and file system parser
// import csv from 'csv-parser';
import fs from 'fs';
import { setTimeout } from 'timers/promises';

// LOAD CSV INTO MEMORY

function loadCSV(myFile) {
    const andaonoanda = fs.readFile('tests.csv', 'ascii', (err, data) => {
        if (err) throw err;
        console.log('esta poronga',data);
        return data
    });
}


// results.forEach(
//     async (i) => {
//         console.log('modelo: ', i.model, 'presio promedio', promediator(priceSplitter(await getPrice(i.url))));
//     })


// TEST SUBJECTS
// const mostExpensive = 'https://everymac.com/systems/apple/macbook_pro/specs/macbook-pro-core-i7-2.9-13-mid-2012-unibody-usb3-specs.html';
// const leastExpensive = 'https://everymac.com/systems/apple/macbook/specs/macbook-core-2-duo-2.0-aluminum-13-late-2008-unibody-specs.html'


// scraping data from HTTP
async function getPrice(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const result = $('table#specs37-title tbody tr td:last-child').text();
        // console.log(result);
        return result;
    } catch (error) {
        console.error(error);
    }
}

// returns an array of clean integers from the scraped data 
function priceSplitter(scraped) {
    const prices = scraped.replace(', ','-').split('-');
    for (let i = 0; i < prices.length; i++) {
        prices[i] = Number(prices[i].replace('US$','').replace('*',''));
    }
    return prices;
}

// select max value
function selectMax(split){
    let max = 0;
    for (let i = 0; i < split.length; i++) {
        if (split[i] >= max) {
            max = split[i]
        }
    }
    return max;
}

// select min value
function selectMin(split){
    let min = split[0];
    for (let i = 0; i < split.length; i++) {
        if (split[i] < min) {
            max = split[i]
        }
    }
    return min;
}

// average of all items in array.
function promediator(allData) {
    let sum = 0;
    for (let index = 0; index < allData.length; index++) {
        sum = sum + allData[index];
    }
    return (sum/allData.length)
}

// MAIN FUNCT
async function main() {
    setTimeout(
        
};
const prices = loadCSV('tests.csv');
console.log(prices);
// console.log(typeof(prices));
    // console.log('promedio: ',promediator(priceSplitter(await getPrice(leastExpensive))));

main();