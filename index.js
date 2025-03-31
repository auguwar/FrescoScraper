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
import { promises as fs } from 'fs';

// loading csv file into an array of objects, each object containing model and url
async function loadCSV(myFile) {
    try {
        const data = await fs.readFile(myFile,'ascii');
        const lines = data.split('\n');
        const results = lines.map(line => {
            const [model, url] = line.split(',');
            return { model, url };
        });
        return results;
    } catch (err) {
        throw err;
    }
}

// turning the array of objects into a new array of objects with the model and price, and then returning the new array
async function pricesFromCSVArr(arr) {
    const newArr = [];
    for (let i = 0; i < arr.length; i++) {
        const price = await getPrice(arr[i].url);
        const split = priceSplitter(price);
        const average = promediator(split);
        const model = arr[i].model;
        const data = {
            model: model,
            price: average
        }
        newArr.push(data);
    }
    return newArr;
}

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
// function selectMax(split){
//     let max = 0;
//     for (let i = 0; i < split.length; i++) {
//         if (split[i] >= max) {
//             max = split[i]
//         }
//     }
//     return max;
// }

// select min value
// function selectMin(split){
//     let min = split[0];
//     for (let i = 0; i < split.length; i++) {
//         if (split[i] < min) {
//             max = split[i]
//         }
//     }
//     return min;
// }

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
    await loadCSV('tests.csv')
    .then(results => pricesFromCSVArr(results))
    .then
    .catch(err => console.error(err));
};

await main();