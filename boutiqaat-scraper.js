  //loading modules
  const cheerio = require('cheerio');
  const puppeteer = require('puppeteer');
  const {Cluster} = require('puppeteer-cluster');
  const XLSX = require('xlsx');
  (async () => {
    //launching the browser in full mode using headless : false
    const browser = await puppeteer.launch({
        headless: false
    });
    //opening a new page
    const page = await browser.newPage();
    //going to the url where we will get all the brands
    await page.goto('https://www.boutiqaat.com/en-ae/women/brands');
    //setting the size of the window
    await page.setViewport({
        width: 1200,
        height: 800
    });
    //scrolling all the way down the page to let all the brands be loaded with javascript so we can scrape them
    await autoScroll(page);
    //getting the content of the page after all the javascript has been loaded
    const html = await page.content();
    //closing the browser because we probably don't need it open at this point
    await browser.close();
    //creating a variable $ that will act as a jquery selector of the page we just scraped using cheerio 
    const $ = cheerio.load(html);
    //this array will be filled with the html of each .brand-item so we can easily process it later and get the data we want 
    const result = [];
    //going through each .brand-item and pushing its html in the resul array
    $('.brand-item').each(function() {
      result.push({
        title: $(this).html(),
      });
    });
    //this array will be filled with the data we need 
    const treated = [];
    //going through the result array and pushing the data we need in the treated array
    result.forEach(function(e){
        
        treated.push({
            brand:$(e.title).children('img').attr('alt'),
            img:$(e.title).children('img').attr('src'),
            url:$(e.title).attr('href')
        });
    });
    const fileName = 'test.xlsx';
    //converting the JSON array we filled above to an excel sheet
    const  WorkSheet = XLSX.utils.json_to_sheet(treated);
    //creating an excel work book
    const WorkBook = XLSX.utils.book_new();
    //putting the sheet in the workbook and naming it test
    XLSX.utils.book_append_sheet(WorkBook, WorkSheet, 'test');
    //writing an excel file in our working directory with the workbook we made
    XLSX.writeFile(WorkBook, fileName);
    //creating a new workbook to fill with product data
    const WorkBook2 = XLSX.utils.book_new();
    //launching a cluster of 4 puppeteer workers in full mode
    //with timeout disabled and a retrying at a maximum of 4 times if a worker fails
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
  
    //going through the treated array and queuing each url to be scraped by the workers
        treated.forEach((e)=>{
        cluster.queue('https://www.boutiqaat.com'+e.url);
     
      })
        
       
    

      //this is the array where the product info will be pushed 
      var treated2 = [];
      //this is where the job of the workers is defined everything the workers do is here
      //I'm using this syntax so that upon resolution we can write to excel because xlsx methods are synchronous
      //and this is obviously async so I'm waiting on the task function to be done and the cluster closed 
     async function task(callback){
        try {
          await cluster.task ( async({page, data: url }) => {
            //disabling default navigation time to deal with slow internet
            await page.setDefaultNavigationTimeout(0);
            //going to the url of each queued url
            await page.goto(url);
    
            //scrolling all the way down to load the products
            
            await autoScroll(page);
            //sometimes the website shows this error but after relaoding 
            //everything is normal so I'm reloading when this error shows up
            while(await page.title()=="Oops"){
              await page.reload();
              await autoScroll(page);
            }
            
            //get the web page content
            var data = await page.content();
            //load the web page content into the cheerio selector
            var $ = cheerio.load(data);
            //same as result i'm getting only the html of the products
            //which is in list-item and putting it in result2
            const result2 = [];
            //using a do while loop to get all products at least once in the case there is only
            //one page but if there are many i'm going through all of them
            do{
               //going through all .list-item elements and pushing their html and the url they go to
               //when clicked in result2
              $('.list-item').each(async function() {
                result2.push({
                  title: $(this).html(),
                  url : $(this).find('.product-image').attr('href')
                });
              
                
              });
              //checking if there are next pages if so going to them by clicking next
              //and loading the content of that page and treating it as usual
             
              if($('.rc-pagination-next').attr('aria-disabled')=='false'){
                await page.click('.rc-pagination-next');
                await page.waitForNavigation();
                await autoScroll(page);
                data = await page.content();
                $ = cheerio.load(data);    
              }
              
            }while($('.rc-pagination-next').attr('aria-disabled')=='false');
           
          //getting all the data i need from result2 and pushing it in treated 2
            result2.forEach(function(e){
                
                treated2.push({
                    image:$(e.title).find('.product-image').children('img').attr('src'),
                   name:$(e.title).find('.product-image').children('img').attr('alt'),
                  price: $(e.title).find('.regular-price').text(),
                    brand:$(e.title).find('.brand-name').text(),
                    url : e.url
                  });
                
                  
            });
            
            
            
            
         
          });
          //when all the workers are done doing their job i'm idling the cluster and closing it
          await cluster.idle();
        await cluster.close();
        //calling callback now that all the work is done
        callback();
          
    
        }
        catch(err){
          console.log(err);
        }
      }
     //calling the function defined above
      task(function(){
        //this is the callback 
        //i'm transforming the JSON array treated2 to an excel sheet putting it in workbook2
        //and writing it to a file
        var WorkSheet2 = XLSX.utils.json_to_sheet(treated2);
        XLSX.utils.book_append_sheet(WorkBook2,WorkSheet2,'products');
        XLSX.writeFile(WorkBook2, 'products.xlsx');
      })
    
      
      

})();

//this is the function that let's us scroll all the way down in a page
async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 200);
        });
    });
}