// leo el csv y a partir de cada valor, genero un objeto con el modelo y el precio
// y lo guardo en un array.
// luego recorro nuevamente ese array de objetos y saco promedio de los precios de los modelos repetidos, que vuelven a ser guardados en un segundo array para luego ser exportados a odoo
// https://everymac.com/systems/by_capability/mac-specs-by-machine-model-machine-id.html listado completo del sitio

// Importing modules
// Scraping related modules
import axios from 'axios';
import * as cheerio from 'cheerio';
// Dotenv for environment variables
import 'dotenv/config';
// CSV and file system parser
import { promises as fs } from 'fs';
const horaminima = 1850/60;

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

// function to get the average price of all models and return an array of objects with the model and average price
function averagePrice(arr) {
    const results = [{model: '', price: 0}];
    const orderedModels = arr.sort((a, b) => a.model.localeCompare(b.model));
    // console.log(orderedModels);
    for (let i = 0; i < orderedModels.length; i++) {
        // console.log(orderedModels[i].model);
        if (orderedModels[i].model !== results[results.length - 1].model) {
            const firstIndex = orderedModels.findIndex((element) => element.model === orderedModels[i].model);
            // console.log('first index: ',firstIndex);
            const lastIndex = orderedModels.findLastIndex((element) => element.model === orderedModels[i].model);
            // console.log('last index: ', lastIndex);
            const values = [];
            for (let j = firstIndex; j <= lastIndex; j++) {
                values.push(orderedModels[j].price);
            }
            console.log('values: ', values);
            results.push({model: orderedModels[i].model, avgPrice: promediator(values)});
        }
    }
    return results.slice(1);
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
    .then(results => averagePrice(results))
    .then(results => console.log(results))
    .catch(err => console.error(err));
};

await main();