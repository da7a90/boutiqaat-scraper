  // reddit-scraper.js

  const cheerio = require('cheerio');
  const puppeteer = require('puppeteer');
  const {Cluster} = require('puppeteer-cluster');
  const XLSX = require('xlsx');
  const fs = require('fs');
  (async () => {
    
    const cluster = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 4,
        puppeteerOptions: {
          headless: false,
          timeout : 0
      },
        retryLimit : 4,
        workerCreationDelay: 1000,
        monitor: true,
        timeout : 500000
    });
  
    
       
        cluster.queue('https://ejadmin.codenurture.com/public/login.php');
    
   
        cluster.queue('https://ejadmin.codenurture.com/public/login.php');
    
   
        cluster.queue('https://ejadmin.codenurture.com/public/login.php');
    
   
        cluster.queue('https://ejadmin.codenurture.com/public/login.php');
    
   
        
       
    

      
      
     
        try {
          await cluster.task ( async({page, data: url }) => {

            await page.setDefaultNavigationTimeout(0);
            await page.goto(url);
            
            await page.type('[name="username"]','admin');
            await page.type('[name="password"]','M123456');
            await page.click('.c-btn');
            
            
            await page.waitForNavigation();

            await page.goto('http://ejadmin.codenurture.com/public/product-form.php');
            await page.waitForNavigation();
            //get the web page content
           
           
            
           
          
      
            
            
            
         
          });
          await cluster.idle();
        await cluster.close();
          
    
        }
        catch(err){
          console.log(err);
        }
      
   
    
      
      

})();

