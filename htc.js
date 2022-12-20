const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/htc-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const htc = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find("div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                htc[i] = {}
                htc[i]['state'] = ($(state).children("strong").text())
                htc[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    htc[i]['states'][j] = {}
                    htc[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    htc[i]['states'][j]['link'] = link

                    htc[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(htc)
                fs.writeFileSync("./htc.json", brand)

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

            const tableDiv = $(postDiv).find(" table > tbody > tr > td:nth-child(1)")
            const divType = $(postDiv).children("div:not(.advlaterale)")

            if (tableDiv.text().length) {
                $(tableDiv).each((i, serviceCenter) => {
                    arr[i] = {}
                    arr[i]["serviceCenter"] = $(serviceCenter).children("h2").text()
                    $(serviceCenter).children("div").each((j, address) => {
                        if (/[A-Za-z]/.test($(address).text()))
                            arr[i]["address"] = $(address).text().replace("\n",",").replaceAll("\t","").replaceAll("    ","").replaceAll(" ","")
                        else
                            arr[i]["phone"] = $(address).text()
                    })
                })
            } else if (divType.text().length) {
                $(divType).each((i, serviceCenter) => {
                    arr[i] = {}
                    arr[i]["serviceCenter"] = $(serviceCenter).children("h2").text()
                    $(serviceCenter).children("div").each((j, address) => {
                        if ($(address).text().includes(","))
                            arr[i]["address"] = $(address).text().replace("\n",",").replaceAll("\t","").replaceAll("    ","").replaceAll(" ","")
                        arr[i]["phone"] = $(address).text()
                    })
                })

            }
            let count = 0
            $(postDiv).children("h2").each((l, headerAddr) => {
                if (!$(headerAddr).text().startsWith('Htc Service Centers')) {
                    arr[count]["serviceCenter"] = $(headerAddr).text()
                    arr[count]["address"]= $(headerAddr).next().text().replaceAll("\n",",").replaceAll("\t","").replaceAll("    ","").replaceAll("\n","")
                    arr[count]["phone"]=$(headerAddr).next().next().text()
                    count++
                }
            })



            resolve(arr)
        } catch (error) {
            // console.error(error)
        }
    })
}