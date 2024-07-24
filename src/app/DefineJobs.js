import cron from 'node-cron'
import managePackage from "../cronJobs/managePackage.js";
import { manageNotification } from '../cronJobs/manageNotification.js';

export const DefineJobs = () => {
  
  console.log("cron Jobs Starts ✔️");

  cron.schedule('*/2 * * * *', () => {
    managePackage();
  });

  cron.schedule('45 22 * * *', () => {
    manageNotification();
  });

  cron.schedule('0 8 * * *', () => {
    manageNotification();
  });
}