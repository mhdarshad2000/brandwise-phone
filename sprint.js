const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/sprint/sprint-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const sprint = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find("div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                sprint[i] = {}
                sprint[i]['state'] = ($(state).children("strong").text())
                sprint[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    if (!$(city).text().includes("other cities")) {
                        sprint[i]['states'][j] = {}
                        sprint[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        sprint[i]['states'][j]['link'] = link
                        sprint[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    } else {
                        const link = $(city).children("a").attr("href").replace("..", baseUrl)
                        const result = await nextPage(link)
                        result.map((elem, index) => {
                            sprint[i]['states'][j + index] = elem
                        })
                    }
                })
            })
            setTimeout(() => {
                const brand = JSON.stringify(sprint)
                fs.writeFileSync("./sprint.json", brand)
            }, 20000)

        } catch (error) {
            console.log(error)
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
                const link = $(city).children("a").attr("href").replace("..", baseUrl + "/sprint")
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
                arr[i]["serviceCenter"] = $(serviceCenter).children("h3").text().replaceAll("\n", "").replaceAll("\t", "").trim()
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


            $(postDiv).find("p.elenchi").each((i, serviceCenter) => {
                if(!$(serviceCenter).children().text().includes("Sprint Customers")){

                    arr[i] = {}
                    arr[i]["serviceCenter"] = $(serviceCenter).children().first().text()
                    arr[i]["address"]= $(serviceCenter).children("span[itemprop='address']").text().replaceAll("\n","").replaceAll("\t","").trim()
                    arr[i]["phone"]= $(serviceCenter).children("span[itemprop='telephone']").text()

                }
            })


            resolve(arr)
        } catch (error) {
            // console.error(error)
        }
    })
}