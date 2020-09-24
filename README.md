# boutiqaat-scraper
a web scraper using a pool of non-headless chromium instances to get the list of brands and products in boutiqaat.com and save them into excel files using puppeteer, puppeteer-cluster and cheerio
you can see in this video https://drive.google.com/file/d/1AW-Wy0i4ozRbZY8VZ9gKtA9bQ28kGseh/view?usp=sharing  a little how it would work.
to try it just clone the repo run `npm install` and then run `node boutiqaat-scraper`
to try it on another website that uses javascript you should just study the website and change the code to incluse the links of the other website and the brand item and product item selectors in cheerio
