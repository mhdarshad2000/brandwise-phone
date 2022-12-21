const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")
const { resolve } = require("path")


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
                    if(!$(city).text().includes("other cities")){
                        lg[i]['states'][j]['name'] = $(city).text()
                        const link = $(city).children("a").attr("href").replace("../", baseUrl)
                        lg[i]['states'][j]['link'] = link
                        lg[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                    }else{
                        const link = $(city).children("a").attr("href").replace("../",baseUrl)
                        await nextPage(link)
                    }
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

async function nextPage(link){
    return new Promise(async(resolve)=>{
        const arr = []
        try {
            const htmlString = await rp(link)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            const ul = $(postDiv).find("ul")
            $(ul).children("li").each(async(i,city)=>{
                arr[i]={}
                arr[i]["name"]=$(city).text()
                const link= $(city).children("a").attr("href").replace("../",baseUrl)
                arr[i]["link"] = link
                arr[i]["city"] = await detailsPageOther(link,$(city).text())
            })
        } catch (error) {
            
        }
    })
}

async function detailsPageOther(otherUrl){
    console.log(otherUrl)
    return new Promise(async(resolve)=>{
        const arr = []
        try {
            const htmlString = await rp(otherUrl)
            console.log(1212)
        const $ = cheerio.load(htmlString)
        const postDiv = $(".post")
        console.log(postDiv.text())
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
                        arr[i]["address"] = $(serviceCenter).parent().text().replace(serviceCenterName,"").split("Phone")[0].trim()
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