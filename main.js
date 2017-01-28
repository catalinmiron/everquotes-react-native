import Exponent from 'exponent';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  Image,
  Alert,
  LayoutAnimation,
  Animated,
  ActivityIndicator
} from 'react-native';


import {Components} from 'exponent'
import Dimensions from 'Dimensions'
const {width, height} = Dimensions.get('window')

import FadeIn from '@exponent/react-native-fade-in-image';
import Config from './config'

/*
  themoviedb:
  http://api.themoviedb.org/3/search/movie?api_key=401d99613457b207ed11170ac072437a&query=Casablanca

  random quote:
  https://market.mashape.com/andruxnet/random-famous-quotes
*/


const TMDB_THUMB = 'http://image.tmdb.org/t/p/w500'
const TMDB_SEARCH_URI = 'http://api.themoviedb.org/3/search/movie'
const BG_OPACITY = 0.85
const ANIM_TIME = 1000


class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      info: {},
      opacity: new Animated.Value(0),
      bg: new Animated.Value(0),
      revertOpacity: new Animated.Value(1),
      currentBgColor: this.randomColor(),
      nextBgColor: this.randomColor(),
    }
  }

  async getQuoteAndPoster() {
    const quote = await this.getQuote()
    const poster = await this.getMoviePosterByQuote(quote)

    this.setState({
      info: Object.assign({}, quote, poster),
      currentBgColor: this.state.nextBgColor,
      nextBgColor: this.randomColor(),
      second_loaded: true
    })

    this.state.bg.setValue(0);
  }

  getQuote() {
    return fetch("https://andruxnet-random-famous-quotes.p.mashape.com/?cat=movies", {
      method: "POST",
      headers: {
        "X-Mashape-Key": Config.MASHAPE_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "cat": "movies"
      }
    }).then(x => x.json()).then(y => y)
  }

  getMoviePosterByQuote(quote) {
    return fetch(`${TMDB_SEARCH_URI}?api_key=${Config.TMDB_KEY}&query=${quote.author}`)
    .then(x => x.json())
    .then(y => {
      // Alert.alert('asdasd', JSON.stringify(quote))
      return {
        oldPoster: this.state.info.poster,
        poster: TMDB_THUMB + y.results[0].poster_path,
        backdrop: TMDB_THUMB + y.results[0].backdrop_path,
        currentBgColor: this.state.nextBgColor,
        nextBgColor: this.randomColor()
      }
    })
  }

  async componentWillMount() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await this.getQuoteAndPoster()
  }

  randomColor() {
    const numbers = [0,1,2].map(i => Math.round(Math.random() * 254))

    return `rgba(${numbers.join(',')}, ${BG_OPACITY});`
  }

  render() {
    const {
      info: {
        quote,
        poster,
        oldPoster,
        author
      },
      isLoading,
      currentBgColor,
      nextBgColor,
    } = this.state

    var bg = this.state.bg.interpolate({
        inputRange: [0, 1],
        outputRange: [
          currentBgColor,
          nextBgColor
        ],
      });

    // Start the animation
    Animated.timing(this.state.bg, {
      tension: 1,
      friction: 20,
      toValue: 1,
      duration: ANIM_TIME
    }).start();

    return (
      <TouchableHighlight
        onPress={() => this.getQuoteAndPoster()}
        style={{flex: 1, alignItems: 'stretch'}}
      >
        <View style={styles.container}>
          <View style={{padding: 10}}>
            <Text style={styles.quote}>{quote}</Text>
            <Text style={styles.quoteMeta}>- {author} -</Text>
          </View>
          <View style={styles.backgroundImageContainer}>
            {this._renderImage()}
          </View>
          <Animated.View style={[styles.backgroundImageContainerBackdrop, {backgroundColor: bg}]}>
          </Animated.View>
        </View>
      </TouchableHighlight>
    );

    // Gradient
    // <Components.LinearGradient
    //   locations={[0.5,0.9]}
    //   style={styles.backgroundImageContainerBackdrop}
    //   start={{x: 0.0, y: 0.25}} end={{x: 0.6, y: 1.0}}
    //   colors={[currentBgColor, nextBgColor]} />
  }

  _renderImage() {
    Animated.parallel([
      Animated.timing(this.state.revertOpacity, {
        toValue: 0,
        duration: ANIM_TIME
      }),
      Animated.timing(this.state.opacity, {
        toValue: 1,
        duration: ANIM_TIME
      })
    ]).start()

    // Alert.alert('asd', JSON.stringify(this.state.info))
    return <Animated.View style={{flex: 1, width: width, height: height, overflow: 'hidden'}}>
      <Animated.Image
        source={{uri: this.state.info.oldPoster}}
        style={[styles.backgroundImage, styles.full, {opacity: this.state.revertOpacity, position: 'absolute', zIndex: 2}]}
      />
      <Animated.Image
        source={{uri: this.state.info.poster}}
        style={[styles.backgroundImage, styles.full, {opacity: this.state.opacity}]}
        onLoad={() => {
          this.setState({loaded: true})

          this.state.revertOpacity.setValue(1)
          this.state.opacity.setValue(0)
        }}
      />
    </Animated.View>
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: {
  },
  backgroundImage: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    width: width,
    height: height,
    resizeMode: 'cover',
  },
  backgroundImageContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    flex: 1,
    zIndex: -1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  backgroundImageContainerBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    opacity: 1,
    zIndex: -1
  },
  quote: {
    fontSize: 42,
    fontWeight: '100',
    color: '#fff'
  },
  quoteMeta: {
    alignSelf: 'flex-end',
    marginVertical: 20,
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    fontStyle: 'italic'
  }
});

Exponent.registerRootComponent(App);
