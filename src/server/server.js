import express from "express";
import dotenv from "dotenv";
import webpack from "webpack";
import React from "react";
import {renderToString} from "react-dom/server";
import { Provider } from "react-redux";
import { createStore} from "redux";
import { StaticRouter } from "react-router-dom";
import reducer from '../frontend/reducers';
import serverRoutes from "../frontend/routes/serverRoutes"
import { renderRoutes}  from "react-router-config";
import helmet from "helmet";
import getManifest from "./getManifest";
import cookieParser from "cookie-parser";
import boom from "@hapi/boom";
import passport from "passport"
import axios from "axios"



dotenv.config();
const app = express();
const { ENV, PORT } = process.env;

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session())

require("./utils/auth/strategies/basic")//BASIC STRATEGY


if(ENV == "development"){
    console.log("Development config")
    const webpackConfig= require("../../webpack.config");
    const webpackDevMiddleware = require("webpack-dev-middleware")
    const webpackHotMiddleware = require("webpack-hot-middleware")
    const compiler = webpack(webpackConfig)
    const serverConfig= {port: PORT, hot: true};

    app.use(webpackDevMiddleware(compiler,serverConfig));
    app.use(webpackHotMiddleware(compiler));
}else{
  app.use((req,res,next)=>{
    if(!req.hashManifest)req.hashManifest= getManifest();
    next()
  })
  app.use(express.static(`${__dirname}/public`));
  app.use(helmet());
  app.use(helmet.permittedCrossDomainPolicies());
  app.disable("x-powered-by");
}

const setResponse = (html, preloadedState, manifest)=>{
  const mainStyles=manifest ? manifest["main.css"] : "assets/app.css"
  const mainBuild = manifest ? manifest["main.js"]: "assets/app.js"
  const vendorBuild = manifest ? manifest["vendors.js"]: "assets/vendor.js"
  return (`<!DOCTYPE html>
  <html>
    <head>
      <link rel="stylesheet" href="${mainStyles}" type="text/css" >
      <title>Platzi Video</title>
    </head>
    <body>
      <div id="app">${html}</div>
      <script>
          window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState).replace(/</g,'\\u003c')}
      </script>
      <script src="${mainBuild}" type="text/javascript"> </script>
      <script src="${vendorBuild}" type="text/javascript"> </script>
     
      </body>
  </html>`);
};


const renderApp=async (req,res)=>{
  let initialState;
  const {email,name,id,token}= req.cookies;


  
  try{
    let movieList= await axios({
      url:`${process.env.API_URL}/api/movies`,
      headers: {Authorization : `Bearer ${token}`},
      method:"get"
    })
    movieList= movieList.data.data;//guardamos la data de la peticion en movieLIst


    initialState={
      user:{id,email,name},
      myList:[],
      trends: movieList.filter(movie => movie.contentRating === "PG" && movie._id),
      originals: movieList.filter(movie=>movie.contentRating ==="G" && movie._id)
    }
  }catch(err){
    initialState={
      user:{},
      myList: [],
      trends: [],
      originals: []
    }
  }




  const store = createStore(reducer,initialState)
  const preloadedState = store.getState();
  const isLogged = (initialState.user.id);
  const html = renderToString(
    <Provider store={store}>

      <StaticRouter location={req.url} context={ {} }>
        {renderRoutes(serverRoutes(isLogged))}
      </StaticRouter>

    </Provider>
  );

res.send(setResponse(html, preloadedState, req.hashManifest))
}

//SIGN-IN/SIGN-UP

app.post("/auth/sign-in", async function(req, res, next) {
  passport.authenticate("basic", function(error, data) {
    try {
      if (error || !data) {
        next(boom.unauthorized());
      }

      req.login(data, { session: false }, async function(err) {
        if (err) {
          next(err);
        }

        const { token, ...user } = data;

        if (ENV !== "development") {
          res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            withCredentials:true
          });
        } else {
          res.cookie("token", token,{withCredentials:true});
        }

        res.status(200).json(user);
      });
    } catch (error) {
      next(error);
    }
  })(req, res, next);
});

app.post("/auth/sign-up", async function(req, res, next) {
  const { body: user } = req;

  try {
    const userData = await axios({
      url: `${process.env.API_URL}/api/auth/sign-up`,
      method: "post",
      data: {
        "email": user.email,
        "name": user.name,
        "password": user.password
      }
    });

    res.status(201).json({
      name:req.body.name,
      email:req.body.email,
      id:userData.data.id
     });
  } catch (error) {
    next(error);
  }
});

app.post("/user-movies", async function(req, res, next) {
  
  try {
    const { body: userMovie } = req;
    const { token } = req.cookies;

    console.log(token)
    console.log(userMovie)

    const { data, status } = await axios({
      url: `${process.env.API_URLl}/api/user-movies`,
      headers: { Authorization: `Bearer ${token}` },
      method: "post",
      data: userMovie,
      withCredentials:true
    });


    if (status !== 201) {
      return next(boom.badImplementation());
    }


    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});



app.get("*",renderApp)

app.listen(PORT, (err)=> {
    if(err){console.log(err)}

    
    console.log(`${ENV} server runing on port ${PORT}`)
})