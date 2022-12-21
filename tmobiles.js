
const cheerio = require("cheerio")
const rp = require("request-promise")
const fs = require("fs")


const baseUrl = "https://www.service-center-locator.com/"
const brandUrl = "https://www.service-center-locator.com/t-mobile/t-mobile-service-center.htm"

async function scrap() {
    return new Promise(async (resolve) => {
        try {
            const tmobiles = []
            const htmlString = await rp(brandUrl)
            const $ = cheerio.load(htmlString)
            const postDiv = $(".post")
            $(postDiv).find(" div:nth-child(9),div:nth-child(10)").children("ul").map((i, state) => {
                tmobiles[i] = {}
                tmobiles[i]['state'] = ($(state).children("strong").text())
                tmobiles[i]['states'] = []
                $(state).children("li").each(async (j, city) => {
                    tmobiles[i]['states'][j] = {}
                    tmobiles[i]['states'][j]['name'] = $(city).text()
                    const link = $(city).children("a").attr("href").replace("../", baseUrl)
                    tmobiles[i]['states'][j]['link'] = link

                    tmobiles[i]['states'][j]['city'] = await detailsPage(link, $(city).text())
                })

            })
            setTimeout(() => {
                const brand = JSON.stringify(tmobiles)
                fs.writeFileSync("./t-mobiles.json", brand)

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


            const tableDiv = $(postDiv).find("table > tbody > tr >td")
            if ($(tableDiv).text()) {
                $(tableDiv).each((i, serviceCenter) => {
                    arr[i] = {}
                    const serviceCenterName = $(serviceCenter).children("strong").text().trim()
                    arr[i]["serviceCenter"] = serviceCenterName
                    const string = $(serviceCenter).parent().text().replace(serviceCenterName,"").split("\n")
                    let address =[]
                    let phone =[] 
                    string.map((elem,index)=>{
                        if(/[a-z]/gi.test(elem)){
                           address.push(elem) 
                        }else{
                            phone.push(elem)
                        }
                    })
                    arr[i]["address"]= address.join().replaceAll("\n","").replaceAll("\t","").trim()
                    arr[i]["phone"] = phone.join().replaceAll(" ","").replaceAll("\n","").replaceAll(",","").replaceAll("\t","").trim()
                    
                })
            }else{
                $(postDiv).children("strong").each((i,serviceCenter)=>{
                    arr[i]={}
                    const serviceCenterName = $(serviceCenter).text()
                    arr[i]["serviceCenter"] = serviceCenterName
                    const string = $(serviceCenter).parent().text().split(serviceCenterName)[1].split("Support for T-Mobile products")[0].replaceAll("\t","").split("\n")
                    let address = []
                    let phone = []
                    string.map((elem,index)=>{
                        if(/[a-z]/gi.test(elem)){
                            address.push(elem)
                         }else{
                             phone.push(elem)
                         }
                    })
                    arr[i]["address"] = address.join().replaceAll("\n","").replaceAll(" ","").trim()
                    arr[i]["phone"] = phone.join().replaceAll(" ","").replaceAll("\n","").replaceAll(",","").trim()
                })
            }
            
            

            resolve(arr)
        } catch (error) {
            // console.error(error)
        }
    })
}