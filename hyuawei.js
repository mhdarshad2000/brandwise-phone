const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/huawei/huawei-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const hyuawei = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find("div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                hyuawei[i] = {}
                hyuawei[i]['state'] = ($(state).children("strong").text())
                hyuawei[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    hyuawei[i]['states'][j] = {}
                    hyuawei[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    hyuawei[i]['states'][j]['link'] = link

                    hyuawei[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(hyuawei)
                fs.writeFileSync("./hyuawei.json", brand)

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

            const checkTable = $(postDiv).find(" table > tbody > tr > td:nth-child(1)")

            if (checkTable.text().length) {
                $(checkTable).each((i, serviceCenter) => {
                    arr[i] = {}
                    arr[i]["serviceCenter"] = $(serviceCenter).children("h2").text()
                    arr[i]["address"] = $(serviceCenter).children("div").first().text().replace("\n",", ").replaceAll("\t","").replaceAll("\ ","")
                    arr[i]["phone"] = $(serviceCenter).children("div:nth-child(3)").text()
                })
            } else {
                let count =0
                $(postDiv).children("h2").each((i,serviceCenter)=>{
                    if(!$(serviceCenter).text().startsWith("Huawei Service Centers")){
                        arr[count] = {}
                        arr[count]["serviceCenter"]=$(serviceCenter).text()
                        arr[count]["address"]=$(serviceCenter).next().text()
                        arr[count]["phone"]=$(serviceCenter).next().next().text()

                        count ++
                    }
                })
            }


            resolve(arr)
        } catch (error) {
            // console.error(error)
        }
    })
}