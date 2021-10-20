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
  boosted?: string;
  boostedYesterday?: string;
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
    'https://datastudio.google.com/embed/reporting/c44fdb36-434f-42a6-bba5-fd24e97f4977',
  );
  await page.waitForSelector('.valueLabel');
  const evaluate = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll('.valueLabel:nth-child(2)'),
      (element) => element.textContent?.trim().replace(/,/g, ' '),
    ),
  );

  const data: IData = {
    reported: evaluate[0] || 'Neplatná hodnota',
    reportedYesterday: evaluate[1] || 'Neplatná hodnota',
    boosted: evaluate[13] || 'Neplatná hodnota',
    boostedYesterday: evaluate[12] || 'Neplatná hodnota',
    ended: evaluate[2] || 'Neplatná hodnota',
    endedYesterday: evaluate[3] || 'Neplatná hodnota',
  };

  await browser.close();

  return data;
};

const tweetVaccinated = async () => {
  const {
    reported,
    reportedYesterday,
    boosted,
    boostedYesterday,
    ended,
    endedYesterday,
  } = await getVaccinated();
  const status = `Vykázaná očkování: ${reported}\nVykázaná očkování za včera: ${reportedYesterday}\nVykázané posilující dávky celkem: ${boosted}\nVykázané posilující dávky za včera: ${boostedYesterday}\nOsoby s ukončeným očkováním celkem: ${ended}\nOsoby s ukončeným očkováním za včera: ${endedYesterday}`;

  T.post('statuses/update', { status: status }, (_err, data: any) => {
    console.log(data);
  });
};

tweetVaccinated();
