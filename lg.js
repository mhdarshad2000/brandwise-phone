const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/lg/lg-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const lg = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find("div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                lg[i] = {}
                lg[i]['state'] = ($(state).children("strong").text())
                lg[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    lg[i]['states'][j] = {}
                    lg[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    lg[i]['states'][j]['link'] = link

                    lg[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(lg)
                fs.writeFileSync("./lg.json", brand)

            }, 7000)

        } catch (error) {

        }
    })
}

scrap()

async function detailsPage(cityUrl, brand) {
    return new Promise(async (resolve) => {
        try {
            const arr = []
            const htmlString = await rp(cityUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")


            $(postDiv).find("p > strong.nomenegozio").each((i, serviceCenter) => {
                if(! $(serviceCenter).text().startsWith("LG Customer Service Representative")){
                    arr[count]={}
                    arr[count]["serviceCenter"] = $(serviceCenter).text()
                }
            })

            resolve(arr)
        } catch (error) {
            // console.error(error)
        }
    })
}