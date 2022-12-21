
const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/uscellular/uscellular-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const usCellular = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                usCellular[i] = {}
                usCellular[i]['state'] = ($(state).children("strong").text())
                usCellular[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    usCellular[i]['states'][j] = {}
                    usCellular[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    usCellular[i]['states'][j]['link'] = link

                    usCellular[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(usCellular)
                fs.writeFileSync("./usCellular.json", brand)

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

            const tableDiv = $(postDiv).find("table > tbody > tr")
            if ($(tableDiv).text()) {
                $(tableDiv).each((i, serviceCenter) => {
                    arr[i] = {}
                    arr[i]["serviceCenter"] = $(serviceCenter).children("td").children("h2").text()
                    $(serviceCenter).children("td").children("div").each((j, address) => {
                        if ($(address).text().includes("\n"))
                            arr[i]["address"] = $(address).text().replaceAll("\n", "").replaceAll("\t", "").trim()
                        else if ($(address).text().length)
                            arr[i]["phone"] = $(address).text()
                    })
                })
            }
            
            resolve(arr)
        } catch (error) {
            // console.error(error)
        }
    })
}