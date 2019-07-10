const fs = require('fs')
const util = require('util')
const puppeteer = require('puppeteer');
const videoshow = require('videoshow');
const uuid = require('uuid/v4');
const md = util.promisify(fs.mkdir);
const Xray = require('x-ray');


/**
 scrape wikipedia history based on being pased a url
    go to wiki page
    find and click view history button
    on history page
      click the '500' button
      click the 'oldest' button
      select the 'pagehistory' ul
 */

// save url to an array or urls
// for each url get screenshot and save to folder


async function getUrls(url) {
  const x = Xray();
  url = url ? url : 'https://en.wikipedia.org/w/index.php?title=Trinidad'
  try {
    const urls = await x(`${url}&dir=prev&limit=100&action=history`, 'ul#pagehistory', [
      'li .mw-changeslist-date@href'
    ]).paginate('.mw-prevlink@href').limit(4)
    console.log(`number of revisions found --- ${urls.length}`)
    return urls
  } catch (error) {
    throw error
  }
}

async function makeVideo(imagesArray) {
  const videoOptions = {
    fps: 24,
    loop: 1, // seconds
    transition: false,
    videoBitrate: 1024,
    videoCodec: 'libx264',
    size: '640x?',
    audioBitrate: '128k',
    audioChannels: 2,
    format: 'mp4',
    pixelFormat: 'yuv420p'
  }
  try {
    const video = videoshow(imagesArray, videoOptions)
    await video.save(`video-${uuid()}.mp4`)
  } catch (error) {
    throw error
  }
}

async function saveScreenshots(urls, folderName) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const imagesArray = []
    for (const [index, url] of urls.entries()) {
      const fullFilePath = `${folderName}/wiki-${index}.png`
      await page.goto(url);
      await page.screenshot({ path: fullFilePath });
      imagesArray.push(fullFilePath)
    }

    await browser.close();
    return imagesArray
  } catch (error) {
    throw error
  }
}

async function run() {
  try {
    const folderName = `./images-${uuid()}`
    await md(folderName)
    const urlArray = await getUrls()
    const imagesArray = await saveScreenshots(urlArray, folderName)
    await makeVideo(imagesArray)
  } catch (error) {
    console.log(error)
  }

}

run()
