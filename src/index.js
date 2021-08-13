const express = require("express");
const bodyParser = require("body-parser");
const TronWeb = require("tronweb");
const fetch = require("node-fetch");

const monedas = require("./monedas.json");

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

//console.log(datos);

const app = express();
const port = process.env.PORT || 3004;
const prykey = process.env.APP_PRYKEY;
const red = process.env.APP_RED || "https://api.trongrid.io";
const SC = process.env.APP_CONTRACT || "TWSh4xWpStE6ubPEQv7BgNtmtEejLjLNcg";
const ver = process.env.APP_VERSION || "v1";

const TRONGRID_API = red;

console.log("Network: " + TRONGRID_API);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Configure Header HTTP
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Allow", "GET, POST, OPTIONS, PUT, DELETE");
  next();
});

tronWeb = new TronWeb(
    TRONGRID_API, 
    TRONGRID_API, 
    TRONGRID_API, 
    prykey
  );

app.get("/", async (req, res) => {
  res.send('<a href="/api/v1">API versión 1.2.1</a>');
});

const ruta = "/api/" + ver;

app.get(ruta, async (req, res) => {
  res.send(
    'Conectado y funcionando v1.0 <br><br> <a href="/consultar/transaccion/">consultar transacciones</a>'
  );
});

app.get(ruta + "/consultar/transaccion/:id", async (req, res) => {
  let id = req.params.id;

  await delay(3000);

  await tronWeb.trx
    .getTransaction(id)
    .then((value) => {
      //  console.log(value.ret[0].contractRet);

      if (value.ret[0].contractRet === "SUCCESS") {
        res.send({ result: true });
      } else {
        res.send({ result: false });
      }
    })
    .catch((value) => {
      console.log(value);
      res.send({ result: false });
    });
});

app.get(ruta + "/precio/:moneda", async (req, res) => {
  let moneda = req.params.moneda;

  const array1 = monedas;

  //console.log(array1);

  const found = array1.find((element) => element.abrebiatura === moneda);

  //console.log(found);

  var response = {};

  let consulta = await fetch(found.apiPrecio).catch((error) => {
    response = {
      Ok: false,
      Message:
        "No exciste o está mal escrito verifica que tu token si esté listado",
      Data: error,
    };
    res.send(response);
  });
  const json = await consulta.json();

  //console.log(json.Data.precio);

  response = found;

  response.Data = json.Data;

  res.send(response);
});

app.get(ruta + "/monedas", async (req, res) => {
  res.send(monedas);
});

app.get(ruta + "/servicio/precio/v1/COPT", async (req, res) => {
  let consulta = await fetch("https://www.dolarhoy.co/widget.js?t=1&c=1").catch(
    (error) => {
      console.error(error);
    }
  );
  var data = await consulta.text();

  data = data.substr(247, 8);
  data = data.replace(/,/g, "");

  //console.log(data);

  let precio = parseFloat(data);
  precio = 1 / precio;

  var response = {
    Ok: true,
    Data: {
      precio: precio,
      par: "COPT_USD",
    },
  };
  res.send(response);
});

app.get(ruta + "/servicio/precio/v2/SITE", async (req, res) => {

  var binarioSite = await tronWeb
    .contract()
    .at(SC);

    let moneda = req.params.moneda;

    const array1 = monedas;
  
    const found = array1.find((element) => element.abrebiatura === moneda);
  
    var contractSITE = await tronWeb.contract().at(found.contrato);
  
    var balanceSITE = await contractSITE.balanceOf(found.pool).call();
  
    var decimales = await contractSITE.decimals().call();
  
    balanceSITE = balanceSITE / 10 ** decimales;
  
    var balanceTRX = await tronWeb.trx.getBalance(found.pool);
  
    balanceTRX = balanceTRX / 10 ** 6;
  
    var end = Date.now();
  
    end = parseInt(end / 1000);
  
    var start = end - 172800 * 2;
  
    let consulta = await fetch(
      "https://api.just.network/swap/scan/statusinfo"
    ).catch((error) => {
      console.error(error);
    });
    var json = await consulta.json();
  
    var Price = (balanceTRX / balanceSITE) * json.data.trxPrice;

    var precioContract = await binarioSite.rate().call();
    precioContract = parseInt(precioContract._hex);

    var compartive = parseInt(Price*10000);
    compartive = compartive*10000;
    
    if ( compartive != precioContract ) {
      await binarioSite.setRates( compartive, compartive ).send();
    }
  
    var response = {
      Ok: true,
      Data: {
        precio: Price,
        par: found.abrebiatura + "_USD",
        contract: precioContract
      },
    };
    res.send(response);

});

app.get(ruta + "/servicio/precio/v3/SITE", async (req, res) => {

  var contractSITE = await tronWeb
    .contract()
    .at("TDDkSxfkN5DbqXK3tHSZFXRMcT9aS6m9qz");

  var balanceSITE = await contractSITE.balanceOf("TMSRvNWKUTvMBaTPFGStWVNtRUQJD72skU").call();

  balanceSITE = balanceSITE / 100000000;

  var balanceTRX = await tronWeb.trx.getBalance("TMSRvNWKUTvMBaTPFGStWVNtRUQJD72skU");

  balanceTRX = balanceTRX / 1000000;

  var end = Date.now();

  end = parseInt(end / 1000);

  var start = end - 172800 * 2;

  let consulta = await fetch(
    "https://api.just.network/swap/scan/statusinfo?exchangeAddress=TMSRvNWKUTvMBaTPFGStWVNtRUQJD72skU"
  ).catch((error) => {
    console.error(error);
  });
  var json = await consulta.json();

  let consulta2 = await fetch(
    "https://apilist.tronscan.io/api/justswap/kline?token_address=TDDkSxfkN5DbqXK3tHSZFXRMcT9aS6m9qz&granularity=1d&time_start=" +
      start +
      "&time_end=" +
      end
  ).catch((error) => {
    console.error(error);
    console.log(consulta2);
  });
  var json2 = await consulta2.json();

  var diferencia = json2.data;

  var cambio24h =
    diferencia[diferencia.length - 1].c / diferencia[diferencia.length - 2].c;

  var Price = (balanceTRX / balanceSITE);


  var response = {
    Ok: true,
    Data: {
      precio: Price,
      par: "SITE_TRX",
      var: (cambio24h - 1) * 100
    }
  };
  res.send(response);
});

app.get(ruta + "/servicio/precio/:moneda", async (req, res) => {
  let moneda = req.params.moneda;

  const array1 = monedas;

  const found = array1.find((element) => element.abrebiatura === moneda);

  var contractSITE = await tronWeb.contract().at(found.contrato);

  var balanceSITE = await contractSITE.balanceOf(found.pool).call();

  var decimales = await contractSITE.decimals().call();

  balanceSITE = balanceSITE / 10 ** decimales;

  var balanceTRX = await tronWeb.trx.getBalance(found.pool);

  balanceTRX = balanceTRX / 10 ** 6;

  var end = Date.now();

  end = parseInt(end / 1000);

  var start = end - 172800 * 2;

  let consulta = await fetch(
    "https://api.just.network/swap/scan/statusinfo"
  ).catch((error) => {
    console.error(error);
  });
  var json = await consulta.json();

  let consulta2 = await fetch(
    "https://apilist.tronscan.io/api/justswap/kline?token_address=" +
      found.contrato +
      "&granularity=1d&time_start=" +
      start +
      "&time_end=" +
      end
  ).catch((error) => {
    console.error(error);
    console.log(consulta2);
  });
  var json2 = await consulta2.json();

  var diferencia = json2.data;

  var cambio24h;

  if (diferencia.length > 1) {
    cambio24h =
      diferencia[diferencia.length - 1].c / diferencia[diferencia.length - 2].c;
  } else {
    cambio24h = 1;
  }

  var Price = (balanceTRX / balanceSITE) * json.data.trxPrice;

  var response = {
    Ok: true,
    Data: {
      precio: Price,
      par: found.abrebiatura + "_USD",
      var: (cambio24h - 1) * 100,
    },
  };
  res.send(response);
});

app.listen(port, () => {
  console.log("Escuchando Puerto: " + port);
  console.log("web: localhost:" + port + ruta);
});
