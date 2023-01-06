const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/oki-phone/oki-phone-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const oki = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                oki[i] = {}
                oki[i]['state'] = ($(state).children("strong").text())
                oki[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    oki[i]['states'][j] = {}
                    oki[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    oki[i]['states'][j]['link'] = link

                    oki[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(oki)
                fs.writeFileSync("./oki.json", brand)

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
            } else {
                $(postDiv).children("h2").each((i, serviceCenter) => {
                    if(!$(serviceCenter).text().includes("Oki Phone Service Centers in Vancouver")){
                        arr[i-1]={}
                        arr[i-1]["serviceCenter"] = $(serviceCenter).text()
                        if(/[a-z]/gi.test($(serviceCenter).next().text())){
                            arr[i-1]["address"] = $(serviceCenter).next().text().replaceAll("\n","").replaceAll("\t","")
                            arr[i-1]["phone"]= $(serviceCenter).next().next().text()
                        }else{
                            arr[i-1]["phone"]= $(serviceCenter).next().text()

                        }
                    }
                })

            }

            resolve(arr)
        } catch (error) {
            // console.error(error)
        }
    })
}