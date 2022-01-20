import React, { Component } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import LinearGradient from 'react-native-linear-gradient'
import Swiper from 'react-native-swiper'
import Text from '../../components/Text'
import { Colors } from '../../themes/Colors'
import { pixel, widthDevice } from '../../utils/DeviceUtil'
import ServiceItem from './ServiceItem'

const data = [
    {
        id: 1,
        name: "Khám nội",
        backgroundUrl: "https://i.stack.imgur.com/Of2w5.jpg"
    },
    {
        id: 2,
        name: "Siêu âm",
        backgroundUrl: "https://i.stack.imgur.com/Of2w5.jpg"
    },
    {
        id: 3,
        name: "Khám tai\nmũi họng",
        backgroundUrl: "https://i.stack.imgur.com/Of2w5.jpg"
    },
    {
        id: 4,
        name: "Y học\ncổ truyền",
        backgroundUrl: "https://i.stack.imgur.com/Of2w5.jpg"
    },
    {
        id: 5,
        name: "Chụp\nX-Quang",
        backgroundUrl: "https://i.stack.imgur.com/Of2w5.jpg"
    },
    {
        id: 5,
        name: "Chụp\nX-Quang",
        backgroundUrl: "https://i.stack.imgur.com/Of2w5.jpg"
    },
    {
        id: 5,
        name: "Chụp\nX-Quang",
        backgroundUrl: "https://i.stack.imgur.com/Of2w5.jpg"
    },
]

export default class HomeScreen extends Component {
    constructor(props) {
        super(props)
        this.state = {

        }
        this.serviceItemWidth = (widthDevice - pixel(180)) / 2
        this.serviceItemHeight = pixel(280)
        this.maxServiceRow = 3
        this.serviceItemMargin = pixel(48)
        this.maxServiceListHeight = this.serviceItemHeight * this.maxServiceRow + this.serviceItemMargin * (this.maxServiceRow - 1)
    }

    fetchData = async () => {
    }

    componentDidMount() {
        this.fetchData()
    }

    renderHeader = () => {
        return <View
            style={styles.headerContainer}>
            <FastImage
                resizeMode={'contain'}
                source={{ uri: "https://i.stack.imgur.com/Of2w5.jpg" }}
                style={styles.logo} />
            <View
                style={styles.headerInfo}>
                <Text
                    bold
                    numberOfLines={2}
                    style={styles.hospitalName}>phòng khám đa khoa ngôi sao</Text>
                <Text
                    numberOfLines={2}
                    semiBold
                    style={styles.welcomeText}>Kính chào quý khách!</Text>
            </View>
        </View>
    }

    renderItem = ({ item, index }) => {
        return (<ServiceItem
            item={item}
            index={index}
            serviceItemWidth={this.serviceItemWidth}
            serviceItemHeight={this.serviceItemHeight}
            serviceItemMargin={this.serviceItemMargin}
        />)
    }

    renderServices = () => {
        return <View>
            <FlatList
                numColumns={2}
                data={data}
                keyExtractor={(item, index) => `${item.id}${index}`}
                renderItem={this.renderItem}
                showsVerticalScrollIndicator={false}
                style={[styles.serviceList, {
                    maxHeight: this.maxServiceListHeight
                }]} />
        </View>

    }

    renderSwiper = () => {
        return (
            <View
                style={styles.swiperContainer}>
                <Swiper
                    showsPagination={false}
                    autoplay
                    loop>
                    {data.map((it, index) => <FastImage
                        key={`${index}`}
                        resizeMode={'cover'}
                        source={{ uri: it.backgroundUrl }}
                        style={{ flex: 1 }} />)}
                </Swiper>
            </View>)
    }

    render() {
        return (
            <LinearGradient
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                colors={[Colors.anti_flash, Colors.white]}
                style={styles.container}>
                <View
                    style={styles.container}>
                    {this.renderHeader()}
                    {this.renderServices()}
                    {this.renderSwiper()}
                </View>
            </LinearGradient>
        )
    }
}


const styles = StyleSheet.create({
    swiperContainer: {
        marginTop: pixel(88),
        flex: 1
    },
    container: {
        flex: 1,
    },
    serviceList: {
        marginTop: pixel(90),
        marginHorizontal: pixel(66),
    },
    serviceName: {
        color: Colors.white,
        fontSize: pixel(40),
        lineHeight: pixel(56),
        letterSpacing: 0.05,
        textTransform: 'uppercase',
        textAlign: 'center'
    },
    serviceItemOverlay: {
        position: 'absolute',
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.kon_75
    },
    serviceBg: {
        position: 'absolute',
        ...StyleSheet.absoluteFillObject,
        height: pixel(280),
    },
    serviceItem: {
        borderRadius: pixel(16),
        height: pixel(280),
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center'
    },
    welcomeText: {
        color: Colors.navy_blue,
        marginTop: pixel(6),
        fontSize: pixel(32),
        lineHeight: pixel(44.8),
    },
    hospitalName: {
        color: Colors.black,
        fontSize: pixel(36),
        lineHeight: pixel(48.6),
        textTransform: 'uppercase',
        letterSpacing: 0.05
    },
    headerInfo: {
        marginLeft: pixel(24),
        flex: 1
    },
    logo: {
        width: pixel(158),
        height: pixel(158),
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: 'center',
        width: widthDevice,
        backgroundColor: Colors.white,
        borderBottomEndRadius: pixel(36),
        borderBottomStartRadius: pixel(36),
        paddingHorizontal: pixel(32),
        paddingTop: pixel(22),
        paddingBottom: pixel(30)
    },
})