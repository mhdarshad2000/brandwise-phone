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
                    if (!$(city).text().includes("other cities")) {
                        lg[i]['states'][j] = {}
                        lg[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        lg[i]['states'][j]['link'] = link
                        lg[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    } else {
                        const link = $(city).children("a").attr("href").replace("..", baseUrl)
                        const result = await nextPage(link)
                        result.map((elem, index) => {
                            lg[i]['states'][j + index] = elem
                        })
                    }
                })
            })
            setTimeout(() => {
                const brand = JSON.stringify(lg)
                fs.writeFileSync("./lg.json", brand)
            }, 20000)

        } catch (error) {

        }
    })
}

scrap()


async function nextPage(url) {
    return new Promise(async (resolve) => {
        try {
            const arr = []
            let promises = []
            const htmlString = await rp(url)
            const $ = cheerio.load(htmlString)
            const div = $(".post")
            await $(div).children("ul").children("li").each(async (i, city) => {
                arr[i] = {}
                arr[i]["name"] = $(city).text()
                const link = $(city).children("a").attr("href").replace("..", baseUrl + "/lg")
                arr[i]["link"] = link
                promises.push({ i, link })
            })
            Promise.all(promises.map(async (i) => {
                arr[i.i]["city"] = await otherCity(i.link)
            })).then(() => {
                resolve(arr)
            })
        } catch (error) {

        }
    })
}

async function otherCity(otherUrl) {
    return new Promise(async (resolve) => {
        try {
            const arr = []
            const htmlString = await rp(otherUrl)
            const $ = cheerio.load(htmlString)
            const div = $(".post")
            $(div).find("div[ itemscope='itemscope']").each((i, serviceCenter) => {
                arr[i] = {}
                arr[i]["serviceCenter"] = $(serviceCenter).children("h3").text()
                arr[i]["address"] = $(serviceCenter).children("div").children("div").children("p").text()
                arr[i]["phone"] = $(serviceCenter).children("div").children("div").children("div [itemprop='telephone']").text()

            })
            resolve(arr)
        } catch (error) {

        }
    })
}

async function detailsPage(cityUrl, brand) {
    return new Promise(async (resolve) => {
        try {
            const arr = []
            const htmlString = await rp(cityUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")

            const table = $(postDiv).find(" table > tbody > tr")

            if ($(table).text()) {
                let count = 0
                $(table).each((i, tableRow) => {
                    if ((i + 1) % 2 !== 0) {
                        arr[count] = {}
                        arr[count]["serviceCenter"] = $(tableRow).children("th").text()
                        arr[count]["address"] = $(tableRow).next().text().split("Address")[1].split(" Phone")[0].trim()
                        arr[count]["phone"] = $(tableRow).next().text().split(" Phone")[1].trim()
                        count++
                    }
                })
            } else {
                $(postDiv).find("p > strong.nomenegozio").each((i, serviceCenter) => {
                    if (!$(serviceCenter).text().includes("LG Customer Service Representative")) {
                        arr[i] = {}
                        const serviceCenterName = $(serviceCenter).text()
                        arr[i]["serviceCenter"] = serviceCenterName
                        arr[i]["address"] = $(serviceCenter).parent().text().replace(serviceCenterName, "").split("Phone")[0].trim()
                        arr[i]["phone"] = $(serviceCenter).parent().text().replace(serviceCenterName, "").split("Phone:")[1].split("Fax:")[0].trim()
                        arr[i]["fax"] = $(serviceCenter).parent().text().replace(serviceCenterName, "").split("Fax:")[1].split("\n")[0].trim()
                    }
                })
            }


            resolve(arr)
        } catch (error) {
            // console.error(error)
        }
    })
}