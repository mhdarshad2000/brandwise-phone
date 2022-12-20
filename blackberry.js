const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/blackberry/blackberry-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const blackberry = []
            const promises = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find("div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                blackberry[i] = {}
                blackberry[i]['state'] = ($(state).children("strong").text())
                blackberry[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    blackberry[i]['states'][j] = {}
                    blackberry[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    blackberry[i]['states'][j]['link'] = link

                    blackberry[i]['states'][j]['city'] = await detailsPage(link,$(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(blackberry)
                fs.writeFileSync("./blackberry.json", brand)

            }, 7000)

        } catch (error) {

        }
    })
}

scrap()

async function detailsPage(cityUrl,brand) {
    return new Promise(async (resolve) => {
        try {
            const arr = []
            const htmlString = await rp({
                method: 'get',
                uri: cityUrl,
                timeout: 600000,
            })
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            let count = 0 
            $(postDiv).children("strong").each((j, serviceCenter) => {
                const serviceCenterName = $(serviceCenter)
                if(!serviceCenterName.text().includes("\n")){
                        arr[count] = {}
                        arr[count]["serviceCenter"] = serviceCenterName.text()
                        let string = $(serviceCenter).parent().text()
                        const tel= string.split("Contact:")
                        if(string.length > 100)
                        arr[count]["address"] = string.split(serviceCenterName.text())[1].split("Contact:")[0].split("\n\n\t\t\n\t\t\n\n\t\t")[0].split("\n\t\t\n\t\t\n\t\t")[0].split("\n        \n")[0].split("\n\n\n")[0].split("Support for Blackberry products")[0].replaceAll("\n","").replaceAll("\t","").trim()
                        else 
                        arr[count]["address"] = string.replace(serviceCenterName.text(),"").replace(tel[1],"").replaceAll("\n","").replaceAll("\t","").replace("Contact:","").replaceAll("   ","").replaceAll(" ","").trim()

                        arr[count]["phone"] = tel[2]?tel[2].replace('x',"*").replace(/[a-z]/gi,'').replaceAll("(","").replaceAll(")","").trim():tel[1]?.split("\n\n\n\t\t")[0].replace('x',"*").replace(/[a-z]/gi,'').replaceAll("(","").replaceAll(")","").trim()
                        count ++
                    }
                
            })
            resolve(arr)
        } catch (error) {
            console.error(error)
        }
    })
}