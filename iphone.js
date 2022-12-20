const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/iphone/iphone-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const iphone = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                iphone[i] = {}
                iphone[i]['state'] = ($(state).children("strong").text())
                iphone[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    iphone[i]['states'][j] = {}
                    iphone[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    iphone[i]['states'][j]['link'] = link

                    iphone[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(iphone)
                fs.writeFileSync("./iphone.json", brand)

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
                if (!$(serviceCenter).text().startsWith("Support for Apple products")) {
                    arr[i] = {}
                    const serviceCenterName = $(serviceCenter).text()
                    arr[i]["serviceCenter"] = serviceCenterName
                    arr[i]["address"] = $(serviceCenter).parent().text().replace(serviceCenterName,"").replaceAll("\n","").replaceAll(" "," ").trim()
                }
            })

            resolve(arr)
        } catch (error) {
            // console.error(error)
        }
    })
}