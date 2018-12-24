const express = require('express');
const PORT = 3333;
const app = express();
let freqArr = [];
const { get } = require('axios');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const Parser = require('rss-parser');
const parser = new Parser();
const zlib = require('zlib');
const trans = require('./trans');

app
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({extended : true}))
  .use(morgan('tiny'))
  .get('/', r => r.res.sendFile(path.join(__dirname+'/htmls/index.html')))

  //name
  .post('/name', (req, res) => {
    res.send(JSON.stringify({"name" : req.body.userName})+ "\n")
  })

  //calculator
  .get('/add/:n1/:n2', (req, res) => {
    freqArr.push('add');
    res
      .set({'Content-Type' : 'text/html; charset=utf-8'})
      .send(`<h4>Сумма : ${+req.params.n1 + +req.params.n2}<h4>`)
  })
  .get('/subtract/:n1/:n2', (req, res) => {
    freqArr.push('subtract');
    res
      .set({'Content-Type' : 'text/html; charset=utf-8'})
      .send(`<h4>Разность : ${+req.params.n1 - +req.params.n2}<h4>`)
  })
  .get('/multiply/:n1/:n2', (req, res) => {
    freqArr.push('multiply');
    res
      .set({'Content-Type' : 'text/html; charset=utf-8'})
      .send(`<h4>Произведение : ${+req.params.n1 * +req.params.n2}<h4>`)
  })
  .get('/divide/:n1/:n2', (req, res) => {
    freqArr.push('divide');
    res
      .set({'Content-Type' : 'text/html; charset=utf-8'})
      .send(`<h4>Деление : ${+req.params.n1 / +req.params.n2}<h4>`)
  })
  .get('/pow/:n1/:n2', (req, res) => {
    freqArr.push('pow');
    res
      .set({'Content-Type' : 'text/html; charset=utf-8'})
      .send(`<h4>Степень : ${Math.pow(+req.params.n1,+req.params.n2)}<h4>`)
  })
  .get('/kramer/:a1/:b1/:c1/:a2/:b2/:c2', (req, res) => {
    freqArr.push('kramer');
    let det = (+req.params.a1 * +req.params.b2) - (+req.params.a2 * +req.params.b1);
    let det1 = (+req.params.c1 * +req.params.b2) - (+req.params.c2 * +req.params.b1);
    let det2 = (+req.params.a1 * +req.params.c2) - (+req.params.a2 * +req.params.c1);
    res
      .set({'Content-Type' : 'application/json; charset=utf-8'})
      .send((det != 0) ? JSON.stringify({"x" : det1/det, "y" : det2/det}) : {"Error! Det = " : det})
  })

  //frequency
  .use('/freq', (req, res) => {
    let result = freqArr.reduce((acc, el) => {
      acc[el] = (acc[el] || 0) +1;
      return acc;
    }, {});
    res
      .set({'Content-Type' : 'application/json; charset=utf-8'})
      .send(JSON.stringify(result))
  })

  //weather
  .get('/weather', async(req, res) => {
    const URL = "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20woeid%3D%222123260%22)%20and%20u%3D'c'&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys";
    const { data : { query : { results : { channel : { item : { forecast : [ , el1 ] }}}}}} = await get(URL, {'Content-Type' : 'application/json'});
    freqArr.push('weather');
    //console.log(el1);
    res
      .set({'Content-Type' : 'text/html; charset=utf-8'})
      .send(`<h4>Date : ${el1.date}</h4>
        <h4>The highest temperature : ${el1.high}&deg;</h4>
        <h4>Самая низкая температура: ${el1.low}&deg;</h4>`)
  })

  //kodaktor apis
  .get('/routers/:n', async(req, res) => {
    const URLs = [
      'http://kodaktor.ru/api2/there/',
      'http://kodaktor.ru/api2/andba/',
    ];
    let num = +req.params.n;
      for (url of URLs) {
        const { data : r} = await get(url + (num), {'Content-Type' : 'application/json'});
        num = r;
        //console.log(num);
      }
      freqArr.push('routers');
    res
      .set({'Content-Type' : 'text/html; charset=utf-8'})
      .send(`<h4>Ответ c Kodaktora : ${num}<h4>`)
  })

  //node-rss
  .get('/node_rss/:n', async (req, res) => {
    let n = +req.params.n;
    let result= '';
    const { items } = await parser.parseURL('https://nodejs.org/en/feed/blog.xml');
    items
      .map(({ title, link }) => ({ title, link }))
      .slice(0, n)
      .forEach(({ title, link }) => {
        result += `<h4><a href=${link} target=_blank>${title}</a></h4>`;
    });
    res.send(result);
  })

  //zip
  .get('/zip', (req, res) => {
    res.sendFile(path.join(__dirname+'/htmls/zip.html'));
  })
  .post('/zip', (req, res) => {
    res.writeHead(200, {'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename=result.zip',});
    req
      .pipe(trans)
      .pipe(zlib.createGzip())
      .pipe(res);
  })

  //static
  .use('/static', express.static('files'))


  .use(r => r
    .res
    .set({'Content-Type' : 'text/html; charset=utf-8'})
    .status(404)
    .end('<b>url does not exist!</b>'))//middleware
  .use((e, r, res, n) => res
    .set({'Content-Type' : 'text/html; charset=utf-8'})
    .status(500)
    .end('<b>Этого не было!</b>'))// n - аргумент next
  .listen(process.env.PORT || PORT, () => console.log('OK!'));
