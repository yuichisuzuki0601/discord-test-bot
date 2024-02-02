import express from 'express';

import { discord as discordConfig, express as expressConfig } from './config.json';
import { send } from './discord';

const { channelId } = discordConfig;
const { port } = expressConfig;

export const init = () => {
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // リクエストが来た時の処理
  app.get('/', (_, res) => {
    console.log(`get api received`);

    send(channelId, 'こんにちは！');

    res.json({ message: 'Sevice is working!' });
  });

  app.listen(port, () => {
    console.log(`Server started. port: ${port}`);
  });
};
