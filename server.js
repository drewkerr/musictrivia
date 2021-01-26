// Load from and save to file

var fs = require('fs')
try {
  var list = require('./db.json')
  console.log(list.length + ' tracks loaded.')
} catch(e) {
  var list = []
  console.log('Tracks reset: ' + e)
}

process.on('SIGTERM', function() {
  fs.writeFile('db.json', JSON.stringify(list), function(err) {
    if (err) {
      console.log(err)
    } else {
      console.log(list.length + ' tracks saved.')
    }
    process.exit(0)
  })
})

// Init server

var express = require('express')
var app = express()

app.use(express.static('public'))
app.set('view engine', 'pug')
app.locals.pretty = true;
app.set('json spaces', 2);

var itunes = require('request')

// Routes

app.get('/', function(request, response) {
  response.render('index', { songs: list } )
})

app.get('/edit', function(request, response) {
  response.render('edit', { songs: list } )
})

app.get('/search', function(request, response) {
  var term = request.query.term
  console.log('Search for:', term)
  var results = { resultCount: 0, results: [] }
  var url = 'https://itunes.apple.com/search?media=music&explicit=no&limit=10&term='
  url += encodeURIComponent(term)
  itunes.get({ url: url, json: true }, (err, res, data) => {
    if (err) {
      console.log('Error:', err)
    } else if (res.statusCode !== 200) {
      console.log('Status:', res.statusCode)
    } else {
      results = data
    }
    response.render('edit', { term: term, results: results, songs: list } )
  })
})

app.get('/add/:trackid/', function(request, response) {
  var trackId = request.params.trackid
  var i = list.findIndex(track => track['trackId'] == trackId)
  if ( i < 0 ) {
    var url = 'https://itunes.apple.com/lookup?id=' + trackId
    itunes.get({ url: url, json: true }, (err, res, data) => {
      if (err) {
        console.log('Error:', err)
      } else if (res.statusCode !== 200) {
        console.log('Status:', res.statusCode)
      } else {
        var song = data.results[0]
        var results = { trackId: song.trackId,
                        artistName: song.artistName,
                        trackName: song.trackName,
                        artworkUrl100: '/'+song.trackId+'.jpg',
                        previewUrl: '/'+song.trackId+'.m4a' }
        itunes(song.artworkUrl100).pipe(fs.createWriteStream('public/'+song.trackId+'.jpg'))
        itunes(song.previewUrl).pipe(fs.createWriteStream('public/'+song.trackId+'.m4a'))
        list.push(results)
        console.log('added:', song.trackName)
      }
    })
  }
  response.redirect('/edit')
})

function delTrack(trackId) {
  var i = list.findIndex(track => track['trackId'] == trackId)
  if ( i >= 0 ) {
    ['artworkUrl100', 'previewUrl'].forEach(function(type) {
      var file = 'public'+list[i][type]
      fs.unlink(file, function(err) {
        if (err) throw err
        console.log(file, 'was deleted')
      })
    })
    list.splice(i, 1)
  }
}

app.get('/del/:trackid/', function(request, response) {
  var trackId = request.params.trackid
  delTrack(trackId)
  response.redirect('/edit')
})

app.get('/reset', function(request, response) {
  list.forEach(function(song) {
    delTrack(song.trackId)
  })
  console.log('Tracks cleared.')
  response.redirect('/edit')
});

app.get('/json', function (request, response) {
  response.json(list)
})

// Listen for requests

var server = require('http').createServer(app)
var listener = server.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port)
})