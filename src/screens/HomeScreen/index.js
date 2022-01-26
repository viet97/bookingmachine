import { delay, size, startCase, toLower } from 'lodash'
import React, { Component } from 'react'
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    View,
    BackHandler,
    Image,
    NativeModules
} from 'react-native'
import AwesomeAlert from 'react-native-awesome-alerts'
import FastImage from 'react-native-fast-image'
import LinearGradient from 'react-native-linear-gradient'
import Swiper from 'react-native-swiper'
import { BLEPrinter } from 'react-native-thermal-receipt-printer'
import Text from '../../components/Text'
import ManagerApi from '../../services/ManagerApi'
import { Colors } from '../../themes/Colors'
import { pixel, widthDevice } from '../../utils/DeviceUtil'
import { stringToSlug } from '../../utils/StringUtils'
import ServiceItem from './ServiceItem'

const closeKiosMode = NativeModules && NativeModules.AndroidUtils && NativeModules.AndroidUtils.closeKiosMode
const data = [
    {
        id: 1,
        name: "Nội",
        backgroundUrl: "https://i.stack.imgur.com/Of2w5.jpg"
    },
    {
        id: 2,
        name: "Ngoại",
        backgroundUrl: "https://i.stack.imgur.com/Of2w5.jpg"
    },
    {
        id: 3,
        name: "Sản",
        backgroundUrl: "https://i.stack.imgur.com/Of2w5.jpg"
    },
    {
        id: 4,
        name: "Nhi",
        backgroundUrl: "https://i.stack.imgur.com/Of2w5.jpg"
    },
    {
        id: 5,
        name: "Tai\nMũi họng",
        backgroundUrl: "https://i.stack.imgur.com/Of2w5.jpg"
    },
    {
        id: 6,
        name: "Mắt",
        backgroundUrl: "https://i.stack.imgur.com/Of2w5.jpg"
    },
    {
        id: 7,
        name: "Răng\nhàm mặt",
        backgroundUrl: "https://i.stack.imgur.com/Of2w5.jpg"
    },
    {
        id: 8,
        name: "Da Liễu",
        backgroundUrl: "https://i.stack.imgur.com/Of2w5.jpg"
    },
    {
        id: 9,
        name: "Y học\ncổ truyền",
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
            isFetching: false,
        }
        this.serviceItemWidth = (widthDevice - pixel(180)) / 2
        this.serviceItemHeight = pixel(280)
        this.maxServiceRow = 3
        this.serviceItemMargin = pixel(48)
        this.maxServiceListHeight = this.serviceItemHeight * this.maxServiceRow + this.serviceItemMargin * (this.maxServiceRow - 1)
        this.countPressLogo = 5
        this.currentCountPressLogo = 0
        this.countPressLogoTimeout = null
        this.timeoutCloseMessage = null
        this.numberTicket = 1000
    }

    initPrinter = async () => {
        try {
            await BLEPrinter.closeConn()
        } catch (e) {

        }
        setTimeout(() => {
            BLEPrinter.init().then(() => {
                BLEPrinter.getDeviceList().then(printers => {
                    if (size(printers) > 0) {
                        this.connectPrinter(printers[0], true)
                    }
                });
            });
        }, 500)

    }

    fetchData = async () => {
        const partner = await (await ManagerApi.getPartner())?.data()
        this.setState({ partner })
        this.initPrinter()
    }

    connectPrinter = (printer, showAlert) => {
        //connect printer
        BLEPrinter.connectPrinter(printer.inner_mac_address).then(
            printer => this.setState({ printer }),
            error => console.warn(error))
    }

    checkPrinter = () => {
        if (!this.state.printer) {
            alert("No printer connected")
            this.initPrinter()
            return false
        }
        return true
    }

    printTextTest = (number, service) => {
        if (!this.checkPrinter()) return
        BLEPrinter.printBill(`<CM>${startCase(toLower(stringToSlug("PHONG KHAM DA KHOA TRUONG SON")))}</CM>\n\n<CB>${number}</CB>\n\n<CM>${startCase(toLower(stringToSlug(service?.name)))}</CM>\n`, {
            beep: true,
            cut: true,
        });
    }

    printBillTest = () => {
        if (!this.checkPrinter()) return
        BLEPrinter.printBill("<C>sample bill</C>");
    }

    componentDidMount() {
        this.fetchData()
    }

    clearTimeoutLogoPress = () => {
        if (this.countPressLogoTimeout) {
            clearTimeout(this.countPressLogoTimeout)
            this.countPressLogoTimeout = null
        }
    }

    setTimeoutMessage = () => {
        this.timeoutCloseMessage = setTimeout(() => {
            this.setState({ showAlert: false })
        }, 3000)
    }

    clearTimeoutMessage = () => {
        if (this.timeoutCloseMessage) {
            clearTimeout(this.timeoutCloseMessage)
            this.timeoutCloseMessage = null
        }
    }

    pressLogo = () => {
        BackHandler.exitApp()
        this.clearTimeoutLogoPress()
        this.currentCountPressLogo++
        if (this.currentCountPressLogo >= this.countPressLogo) {
            this.initPrinter()
            this.currentCountPressLogo = 0;
            this.clearTimeoutLogoPress()
        }
        this.countPressLogoTimeout = setTimeout(() => {
            this.currentCountPressLogo = 0;
        }, 3000)
    }

    renderHeader = () => {
        const { partner } = this.state
        return <View
            style={styles.headerContainer}>
            <Pressable
                onPress={this.pressLogo}
                delayLongPress={7000}
                onLongPress={async () => {
                    await closeKiosMode()
                    alert("Lock mode disabled!")
                }}>
                <Image
                    resizeMode={'cover'}
                    source={{ uri: 'data:image/jpeg;base64,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' }}
                    style={styles.logo} />
            </Pressable>
            <View
                style={styles.headerInfo}>
                <Text
                    bold
                    numberOfLines={2}
                    style={styles.hospitalName}>Phòng khám Đa khoa Trường Sơn</Text>
                <Text
                    numberOfLines={2}
                    semiBold
                    style={styles.welcomeText}>Quý khách ấn chuyên khoa để lấy số</Text>
            </View>
        </View>
    }


    delay = (number) => new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, number);
    })

    onPressServiceItem = async (service) => {
        await this.delay(1000)
        this.printTextTest(this.numberTicket, service)
        this.numberTicket += 2
        return
        this.setState({ isFetching: true })
        try {
            const response = await ManagerApi.bookLocal()
            if (response?.data?.status === 200) {
                const numberTicket = response?.data?.data?.numberTicket
                this.setState({
                    message: `Number ticket: ${numberTicket}`,
                    showAlert: true
                }, this.setTimeoutMessage)
                this.printTextTest(numberTicket, service)
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
            onPressServiceItem={() => this.onPressServiceItem(item)}
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
                    // maxHeight: this.maxServiceListHeight
                }]} />
        </View>

    }

    renderSwiper = () => {
        return null
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
        const { partner, message, showAlert } = this.state
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
                <AwesomeAlert
                    show={showAlert}
                    showProgress={false}
                    message={message}
                    closeOnTouchOutside={true}
                    closeOnHardwareBackPress={false}
                    showConfirmButton
                    confirmText="OK"
                    onDismiss={() => {
                        this.clearTimeoutMessage()
                        this.setState({ showAlert: false })
                    }}
                    onConfirmPressed={() => {
                        this.setState({ showAlert: false })
                    }}
                />
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
        borderRadius: pixel(100)
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