import axios from 'axios';
import cheerio from 'cheerio';
import dotenv from 'dotenv';
import Twit from 'twit';

dotenv.config();

const T = new Twit({
  consumer_key: process.env.CONSUMER_KEY!,
  consumer_secret: process.env.CONSUMER_SECRET!,
  access_token: process.env.ACCESS_TOKEN!,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET!,
});

const getVaccinated = async () => {
  const generalUrl = 'https://onemocneni-aktualne.mzcr.cz/covid-19';
  const html = await axios({
    method: 'get',
    url: generalUrl,
    responseType: 'text',
  }).then((x: any) => x.data);

  const $ = cheerio.load(html);

  return $('#count-test')
    .eq(1)
    .attr('data-value')
    ?.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const tweetVaccinated = async () => {
  const vaccinated = await getVaccinated();
  const {
    data: [{ text }],
  }: any = await T.get('statuses/user_timeline');

  if (vaccinated !== text) {
    T.post('statuses/update', { status: vaccinated }, (_err, data: any) => {
      console.log(data);
    });
  }
};

tweetVaccinated();
