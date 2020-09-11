var express = require('express');
var boardContents = require('../models/boardsSchema'); 
var fs = require('fs');
var multer = require('multer'); 
var upload = multer({dest:'./tmp/'}); 
var router = express.Router();

/*
ROUTE						METHOD		DESCRIPTION

/board						GET			retrieve all contents(posts) and display page
/board/regist				GET	 		display new post form
/board/regist				POST		Create new post
/board/article/:id			GET			Read post with id and display post
/board/edit/:id				GET			display edit post form with id 
/board/update				POST		Update post with id and redirect to article
/board/delete/:id			GET			Delete post with id and redirect to board
/board/reply				POST		add comment and redirect to article
*/

router.get('/', function(req,res){
    // limit: 10, skip: (page-1)*10 
    // when first connect, there is no param, so set page number as 1.
    var page = req.query.page;
    if(page == null) {
		page = 1;
	}

    var skipSize = (page - 1)*10;
    var limitSize = 10;
    var pageNums = 1;

    boardContents.count({}, function(err, totCnt) {
        if(err) throw err;

        pageNums = Math.ceil(totCnt/limitSize);
		// sort with date
        boardContents.find({}).sort({date:-1}).skip(skipSize).limit(limitSize).exec(function(err, pageContents) {
            if(err) throw err;
            res.render('board', {title: "Board", contents: pageContents, pagination: pageNums});
        });
    });
});

router.get('/regist', function(req,res){
	res.render('regist', {title: "New Post"});
});

router.post('/regist', upload.array('UploadFile'),function(req, res){
    
    var addNewTitle = req.body.addContentSubject;
    var addNewWriter = req.body.addContentWriter;
    var addNewPassword = req.body.addContentPassword;
    var addNewContent = req.body.addContents;

    addBoard(addNewTitle, addNewWriter, addNewContent, addNewPassword);
    res.redirect('/board');    
});

router.get('/article/:id', function(req, res){
    var contentId = req.params.id;

    boardContents.findOne({_id:contentId}, function(err, result){
        if(err) throw err;
		
        result.count += 1;        
        result.save(function(err) {
            if(err) throw err;

            res.render('article', {title: "Article", content: result});
        });
    })
});

router.get('/edit/:id', function(req, res){
	var contentId = req.params.id;

    boardContents.findOne({_id:contentId}, function(err, result){
        if(err) throw err;

		result.contents = result.contents.replace(/<br>/gi, "\r\n")
        res.render('edit', {title: "Edit", content: result});
        
    })
});

router.post('/update', function(req, res){

    var modTitle = req.body.modContentSubject;
    var modContent = req.body.modContents;
    var modId = req.body.articleId;

    modBoard(modId, modTitle, modContent);
    res.redirect('/board/article/'+modId);
});

router.get('/delete/:id', function(req, res) {

    var contentId = req.params.id;

    boardContents.remove({_id:contentId}, function(err){
        if(err) throw err;
        res.redirect('/board');
    });
});

router.post('/reply', function(req, res){

    var replyWriter = req.body.replyWriter;
    var replyComment = req.body.replyComment;
    var replyId = req.body.articleId;

    addComment(replyId, replyWriter, replyComment);

    res.redirect('/board/article/'+replyId);
});

module.exports = router;


function addBoard(title, writer, content, password) {
    var newContent = content.replace(/\r\n/gi, "<br>");

    var newBoardContents = new boardContents;
    newBoardContents.writer = writer;
    newBoardContents.title = title;
    newBoardContents.contents = newContent;
    newBoardContents.password = password;

    newBoardContents.save(function (err) {
        if (err) throw err;
    });
}

function modBoard(id, title, content) {
    var modContent = content.replace(/\r\n/gi, "<br>");

    boardContents.findOne({_id:id}, function(err, result){
        if(err) throw err;
        result.updated.push({title: result.title, contents: result.contents});
        result.save(function(err) {
            if(err) throw err;
        });
    });

    boardContents.update({_id:id}, {$set: {title: title, contents: modContent, date: Date.now()}}, function(err) {
        if(err) throw err;
    });
}

function addComment(id, writer, comment) {
    boardContents.findOne({_id: id}, function(err, result){
        if(err) throw err;

        result.comments.unshift({name:writer, memo: comment});
        result.save(function(err){
            if(err) throw err;
        });
    });
}