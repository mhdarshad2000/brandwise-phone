const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/motorola/motorola-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const motorola = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find("div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                motorola[i] = {}
                motorola[i]['state'] = ($(state).children("strong").text())
                motorola[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    if (!$(city).text().includes("other cities")) {
                        motorola[i]['states'][j] = {}
                        motorola[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        motorola[i]['states'][j]['link'] = link
                        motorola[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                        } else {
                            const link = $(city).children("a").attr("href").replace("..", baseUrl)
                        const result = await nextPage(link)
                        result.map((elem, index) => {
                            motorola[i]['states'][j + index] = elem
                        })
                    }
                })
            })
            setTimeout(() => {
                const brand = JSON.stringify(motorola)
                fs.writeFileSync("./motorola.json", brand)
            }, 7000)

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
                const link = $(city).children("a").attr("href").replace("..", baseUrl + "/motorola")
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
                arr[i]["serviceCenter"] = $(serviceCenter).children("h3").text().replaceAll("\n","").replaceAll("\t","").trim()
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
            let count = 0
            $(postDiv).children("p").each((i, serviceCenter) => {
                if ($(serviceCenter).children("strong").length === 1 &&
                    !$(serviceCenter).text().includes("Zip Code") &&
                    !$(serviceCenter).text().includes("Support for Motorola") &&
                    !$(serviceCenter).text().includes("Phone:") &&
                    !$(serviceCenter).text().includes("Motorola Support Products")) {
                    arr[count] = {}
                    const serviceCenterName = $(serviceCenter).children("strong").text().replaceAll("\n","").replaceAll("\t","").trim()
                    arr[count]["serviceCenter"] = serviceCenterName.replaceAll("\n", "").replaceAll("\t", "").trim()

                    const addr = $(serviceCenter).text().replace(serviceCenterName, "").split("\n")

                    let phone = []
                    addr.map((elem, index) => {
                        elem = elem.replaceAll(" ", "").trim()
                        if (!/[a-z]/gi.test(elem) && elem.length > 10) {
                            addr[index] = ""
                            phone.push(elem)
                        }
                    })
                    arr[count]["phone"] = phone.join()
                    const address = addr.join().replace(phone.join(), "").replaceAll("   ", "").replaceAll(",", "  ").trim()
                    let fax
                    if (address.includes("(FAX):")) {
                        fax = address.split("(FAX):")[1].split("    ")[0]
                    } else if (address.includes("Fax:")) {
                        fax = address.split("Fax:")[1].split("  ")[0]
                    }

                    arr[count]["fax"] = fax

                    const string = address.split("(FAX):")[0].split("Fax:")[0].split("  ")
                    string.map((elem, index) => {
                        if (elem.includes(".com")) string[index] = ""
                    })

                    arr[count]["address"] = string.join().replaceAll(",,", ",").replace(",", "    ")
                    count++
                }
            })

            resolve(arr)
        } catch (error) {
            // console.error(error)
        }
    })
}