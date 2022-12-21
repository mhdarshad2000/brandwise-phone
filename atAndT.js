
const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/att/att-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const atNt = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(11),div:nth-child(12)").children("ul").map((i, state) => {
                atNt[i] = {}
                atNt[i]['state'] = ($(state).children("strong").text())
                atNt[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    atNt[i]['states'][j] = {}
                    atNt[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    atNt[i]['states'][j]['link'] = link

                    atNt[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(atNt)
                fs.writeFileSync("./at&t.json", brand)

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

            $(postDiv).find("table > tbody > tr > td > div > div").each((i,serviceCenter)=>{
                arr[i]={}
                arr[i]["serviceCenter"] = $(serviceCenter).children("h4").first().text()
                const address = $(serviceCenter).children("p").first().text().replaceAll("\t","")
                
                let phone = []
                const temp = address.split("\n")
                temp.map((elem,index)=>{
                    if(!/[a-z]/gi.test(elem)){
                        phone.push(elem)
                    }
                })
                const phoneStr= phone.join().replaceAll(",","").trim()
                arr[i]["address"] = address.split(phoneStr)[0].replaceAll("\n", ",").trim()
                arr[i]["phone"] = phoneStr
                
                
            })
            
            resolve(arr)
        } catch (error) {
            // console.error(error)
        }
    })
}