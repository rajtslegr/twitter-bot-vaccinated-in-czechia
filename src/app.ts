import dotenv from 'dotenv';
import puppeteer from 'puppeteer';
import Twit from 'twit';

dotenv.config();

const T = new Twit({
  consumer_key: process.env.CONSUMER_KEY || '',
  consumer_secret: process.env.CONSUMER_SECRET || '',
  access_token: process.env.ACCESS_TOKEN || '',
  access_token_secret: process.env.ACCESS_TOKEN_SECRET || '',
});

interface IData {
  reported?: string;
  reportedYesterday?: string;
  ended?: string;
  endedYesterday?: string;
}

const getVaccinated = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--lang=cs-CS,cs'],
  });
  const page = await browser.newPage();

  await page.setViewport({ width: 1920, height: 926 });
  await page.goto(
    'https://datastudio.google.com/embed/reporting/95dd159f-aaef-4d81-ab96-56d77484b9ae',
  );
  await page.waitForSelector('.valueLabel');
  const evaluate = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll('.valueLabel:nth-child(2)'),
      (element) => element.textContent?.trim().replace(/,/g, ' '),
    ),
  );

  const data: IData = {
    reported: evaluate[0] || 'Error',
    reportedYesterday: evaluate[1] || 'Error',
    ended: evaluate[2] || 'Error',
    endedYesterday: evaluate[3] || 'Error',
  };

  await browser.close();

  return data;
};

const tweetVaccinated = async () => {
  const { reported, reportedYesterday, ended, endedYesterday } =
    await getVaccinated();
  const status = `Vykázaná očkování celkem: ${reported}\nVykázaná očkování za včera: ${reportedYesterday}\nOsoby s ukončeným očkováním (dvě dávky) celkem: ${ended}\nOsoby s ukončeným očkováním celkem za včera: ${endedYesterday}`;

  T.post('statuses/update', { status: status }, (_err, data: any) => {
    console.log(data);
  });
};

tweetVaccinated();
