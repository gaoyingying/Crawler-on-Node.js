var http=require('http')
var cheerio=require('cheerio')
var Promise=require('bluebird')
var baseUrl='http://www.imooc.com/learn/'
var videoIds=[728,637,348,259,197,134,75]
function getPageAsync(url){
    return new Promise(function(resolve,reject){
        console.log('crawling...'+url)
        http.get(url,function(res){
            var html=""
            res.on('data',function(data){
                html+=data;
            })
            //爬取数据成功调用resolve(html)
            res.on('end',function(){
                resolve(html)//将参数暴露出去
            })
        }).on('error',function(e){
            //爬取数据出错调用reject()
            reject(e)
            console.log("读取课程出错！"+'\n');
        })
    })
}
var fetchCourseArray=[]//存放promise对象的数组
videoIds.forEach(function(id){
    fetchCourseArray.push(getPageAsync(baseUrl+id))
})
Promise.all(fetchCourseArray)//尝试获取fetchCourseArray中所有的promise对象
.then(function(pages){//pages是所有promise对象的resolve暴露出来的同一个参数html
    var coursesData=[]
    pages.forEach(function(page){
        var course=filterCourse(page)//返回course对象
        coursesData.push(course)
    })
    //排序
    coursesData.sort(function(a,b){
        return a.number<b.number//从大到小
    })
    //打印
    printData(coursesData)
})
function filterCourse(html){
    var $=cheerio.load(html)
    var chapters=$('.chapter')
    var title=$('.hd').find('h2').text()
    var number=parseInt($('.js-learn-num').text().trim(),10)
    //number服务器异步加载所以找不到

    var courseData={
    chapters:[],
    number:number,
    title:title
    }

    chapters.each(function(item){
        var chapter=$(this)
        var chapterTitle=chapter.find('strong').contents().filter(function(){
            return this.nodeType==3
        }).text().replace(/\s+/g,"")
        var videos=chapter.find('.video').children('li')
        var chapterData={chapterTitle:chapterTitle,videos:[]}
        videos.each(function(item){
            var video=$(this)
            var videoTitle=video.find('.J-media-item').contents().filter(function(){
            return this.nodeType==3
        }).text().replace(/\s+/g,"")
            var id=video.find('.J-media-item').attr('href').split('video/')[1]
            chapterData.videos.push({
                title:videoTitle,
                id:id
            }) 
        })
        courseData.chapters.push(chapterData)
    })
    return courseData
}
function printData(coursesData){
    coursesData.forEach(function(courseData){
        console.log(courseData.number+'人学过'+courseData.title)
        courseData.chapters.forEach(function(chapter){
            console.log(chapter.chapterTitle)
            chapter.videos.forEach(function(video){
            console.log('【'+video.id+'】'+video.title.trim()+'\n')
        })
        })
        
    })
}
