const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/nokia/nokia-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const nokia = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(8),div:nth-child(9)").children("ul").map((i, state) => {
                nokia[i] = {}
                nokia[i]['state'] = ($(state).children("strong").text())
                nokia[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    nokia[i]['states'][j] = {}
                    nokia[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    nokia[i]['states'][j]['link'] = link

                    nokia[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(nokia)
                fs.writeFileSync("./nokia.json", brand)

            }, 20000)

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

            $(postDiv).find("p.elenchi").each((i,serviceCenter)=>{
                arr[i]={}
                arr[i]["serviceCenter"] = $(serviceCenter).children("strong").text()
                arr[i]["address"] = $(serviceCenter).children("span.evidenziato").text()
                arr[i]["phone"] = $(serviceCenter).children("span:not(.evidenziato)").first().text().replace("Phone:","").trim()
                arr[i]["fax"] = $(serviceCenter).children("span:not(.evidenziato)").last().text().replace("Fax:","").trim()

            })
            


            resolve(arr)
        } catch (error) {
            // console.error(error)
        }
    })
}