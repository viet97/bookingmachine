import { size } from 'lodash'
import React, { Component } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View, BackHandler, Platform } from 'react-native'
import FastImage from 'react-native-fast-image'
import LinearGradient from 'react-native-linear-gradient'
import Swiper from 'react-native-swiper'
import { BLEPrinter } from 'react-native-thermal-receipt-printer'
import Text from '../../components/Text'
import ManagerApi from '../../services/ManagerApi'
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

const listImage = [
    "https://vidoctor.vn/assets/img/og.jpg",
    "https://www.hangngoainhap.com.vn/cdn3/images/SP-khac/but-diet-virus-taiko-cleverin-cua-nhat-ban-tai-dai-ly-3.jpg",
    "https://www.who.int/images/default-source/infographics/logo-who.tmb-1200v.jpg?Culture=en&sfvrsn=2fcc68a0_15",
    "http://www.npt.com.vn//userfile/images/LogoEVN_16-9-20191114104101025.jpg",
]

export default class HomeScreen extends Component {
    constructor(props) {
        super(props)
        this.state = {
            partner: null,
            isFetching: false
        }
        this.serviceItemWidth = (widthDevice - pixel(180)) / 2
        this.serviceItemHeight = pixel(280)
        this.maxServiceRow = 3
        this.serviceItemMargin = pixel(48)
        this.maxServiceListHeight = this.serviceItemHeight * this.maxServiceRow + this.serviceItemMargin * (this.maxServiceRow - 1)
    }

    fetchData = async () => {
        const partner = await (await ManagerApi.getPartner())?.data()
        this.setState({ partner })
        BLEPrinter.init().then(() => {
            BLEPrinter.getDeviceList().then(printers => {
                console.log("printers", printers)
                // if (size(printers) > 0) {
                //     this.connectPrinter(printers[0])
                // }
            });
        });
    }

    connectPrinter = (printer) => {
        //connect printer
        BLEPrinter.connectPrinter(printer.inner_mac_address).then(
            printer => this.setState({ printer }),
            error => console.warn(error))
    }

    checkPrinter = () => {
        if (!this.state.printer) {
            alert("No printer connected")
            return false
        }
        return true
    }

    printTextTest = () => {
        if (!this.checkPrinter()) return
        BLEPrinter.printText("<C>sample text</C>\n");
    }

    printBillTest = () => {
        if (!this.checkPrinter()) return
        BLEPrinter.printBill("<C>sample bill</C>");
    }

    componentDidMount() {
        this.fetchData()
    }

    renderHeader = () => {
        const { partner } = this.state
        return <View
            style={styles.headerContainer}>
            <Pressable
                delayLongPress={10000}
                onLongPress={() => {
                    if (Platform.OS === 'android')
                        BackHandler.exitApp()
                }}>
                <FastImage
                    resizeMode={'contain'}
                    source={{ uri: "data:image/jpeg;base64,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" }}
                    style={styles.logo} />
            </Pressable>
            <View
                style={styles.headerInfo}>
                <Text
                    bold
                    numberOfLines={2}
                    style={styles.hospitalName}>{partner.name}</Text>
                <Text
                    numberOfLines={2}
                    semiBold
                    style={styles.welcomeText}>Kính chào quý khách!</Text>
            </View>
        </View>
    }

    onPressServiceItem = async () => {
        this.setState({ isFetching: true })
        try {
            const response = await ManagerApi.bookLocal()
            if (response?.data?.status === 200) {
                const numberTicket = response?.data?.data?.numberTicket
                alert(`Number ticket: ${numberTicket}`)
            }
        } catch (e) {
            console.error("bookLocal error", e)
        }
        this.setState({ isFetching: false })
    }

    renderItem = ({ item, index }) => {
        return (<ServiceItem
            disabled={this.state.isFetching}
            item={item}
            index={index}
            serviceItemWidth={this.serviceItemWidth}
            serviceItemHeight={this.serviceItemHeight}
            serviceItemMargin={this.serviceItemMargin}
            onPressServiceItem={this.onPressServiceItem}
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
                <View
                    style={styles.swiperContentContainer}>
                    <Swiper
                        showsPagination={false}
                        autoplay
                        removeClippedSubviews={false}
                        autoplayTimeout={5}
                        loop>
                        {listImage.map((uri) => <FastImage
                            key={`${uri}`}
                            resizeMode={'cover'}
                            source={{ uri }}
                            style={{ flex: 1 }} />)}
                    </Swiper>
                </View>
            </View>)
    }

    render() {
        if (!this.state.partner) return <View
            style={styles.containerLoading}>
            <ActivityIndicator size={"large"} />
        </View>
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
    swiperContentContainer: {
        flex: 1,
        maxHeight: pixel(620),
    },
    containerLoading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: "center"
    },
    swiperContainer: {
        marginTop: pixel(88),
        flex: 1,
        justifyContent: 'flex-end'
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