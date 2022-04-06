import { find, isString, size, split } from 'lodash'
import React, { Component } from 'react'
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    View,
    DeviceEventEmitter,
    NativeModules
} from 'react-native'
import AwesomeAlert from 'react-native-awesome-alerts'
import FastImage from 'react-native-fast-image'
import LinearGradient from 'react-native-linear-gradient'
import Swiper from 'react-native-swiper'
import Text from '../../components/Text'
import ManagerApi from '../../services/ManagerApi'
import { Colors } from '../../themes/Colors'
import { pixel, widthDevice } from '../../utils/DeviceUtil'
import { resolveImagePath } from '../../utils/ImageUtil'
import { stringToSlug } from '../../utils/StringUtils'
import ServiceItem from './ServiceItem'

const { closeKiosMode, clearDeviceOwner, closeConnect, scanAndConnectUsbPrinter, print } = NativeModules.AndroidUtils

export default class HomeScreen extends Component {
    constructor(props) {
        super(props)
        this.state = {
            isFetching: false,
            lanes: null
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
        this.ticketNumber = 1000
        // this.ws = new WebSocket("ws://192.168.31.89:3001")
    }

    initPrinter = async () => {
        try {
            await closeConnect()
            this.setState({ printer: false })
        } catch (e) {

        }
        setTimeout(() => {
            scanAndConnectUsbPrinter().then(() => {
                this.setState({ printer: true })
                alert("Printer Connected")
            }).catch(() => {
                console.error("cannot connect usb printer")
                this.initPrinter()
            })
        }, 500)

    }

    fetchData = async () => {
        const arrayResponse = await Promise.all([ManagerApi.apis(), ManagerApi.getBanners()])
        if (size(arrayResponse) && arrayResponse[0].data) {
            const { lanes, tickets, slogan, logo, name } = arrayResponse[0].data
            this.setState({ lanes, tickets, slogan, logo, name })
        }
        if (size(arrayResponse) >= 2 && arrayResponse[1].data) {
            const { fromHost, fromPartner } = arrayResponse[1].data
            if (fromHost && fromPartner) {
                this.setState({ banner: [...fromHost, ...fromPartner] })
            }
        }

        this.initPrinter()
    }

    checkPrinter = () => {
        if (!this.state.printer) {
            alert("No printer connected")
            this.initPrinter()
            return false
        }
        return true
    }

    printTicket = (number, service) => {
        if (!this.checkPrinter()) return
        return print(
            `[C]<b><font size='wide'>${stringToSlug(this.state.name)}</font></b>\n` +
            `[C]<b><font size='wide'>${stringToSlug(`${number}`)}</font></b>\n` +
            `[C]<b><font size='wide'>${stringToSlug(service.name)}</font></b>\n`
        );
    }

    onBarcodeScan = async (payload) => {
        if (!isString(payload)) return
        const payloadArray = split(payload, ",")
        if (size(payloadArray) !== 3) return
        const { lanes } = this.state
        const userId = payloadArray[0]
        const serviceId = payloadArray[1]
        const ticketCode = Number(payloadArray[2])
        const service = find(lanes, lane => lane._id === serviceId)
        const response = await ManagerApi.add({ lane: serviceId, userId, ticketCode })
        if (response?.status === 200) {
            const numberTicket = response?.data?.ticket?.number
            this.setState({
                message: `Number ticket: ${numberTicket}`,
                showAlert: true
            }, this.setTimeoutMessage)
            this.printTicket(numberTicket, service)
            this.setState({ isFetching: false })
        }
    }

    onPrinterAttached = () => {
        this.initPrinter()
    }

    componentDidMount() {
        this.fetchData()
        this.listenerKeyDown = DeviceEventEmitter.addListener('onBarcodeScan', this.onBarcodeScan);
        this.printerAttachedListener = DeviceEventEmitter.addListener('onPrinterAttached', this.onPrinterAttached);
        // this.ws.addEventListener('open', (event) => {
        //     // socket.send('Hello Server!')
        //     console.log("Hello Server")
        //     this.ws.send(JSON.stringify({
        //         action: "add",
        //         data: {
        //             lane: "1"
        //         }
        //     }))
        // });
        // this.ws.addEventListener('close', e => {
        //     console.log("disconnect", e)

        // })
        // // Listen for messages
        // this.ws.addEventListener('message', function (event) {
        //     console.log('Message from server ', event.data);
        // });
    }
    componentWillUnmount() {
        this.listenerKeyDown && this.listenerKeyDown.remove()
        this.listenerKeyDown = null
        this.printerAttachedListener && this.printerAttachedListener.remove()
        this.printerAttachedListener = null
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
        return <View
            style={styles.headerContainer}>
            {/* fake view to receive touch when scan barcode */}
            <Pressable style={{ position: 'absolute', opacity: 0 }} >
                <FastImage
                    resizeMode={'contain'}
                    source={{ uri: resolveImagePath(this.state.logo) }}
                    style={styles.logo} />
            </Pressable>
            <Pressable
                onPress={this.pressLogo}
                delayLongPress={7000}
                onLongPress={async () => {
                    await closeKiosMode()
                    alert("Lock mode disabled!")
                }}>
                <FastImage
                    resizeMode={'contain'}
                    source={{ uri: resolveImagePath(this.state.logo) }}
                    style={styles.logo} />
            </Pressable>
            <View
                style={styles.headerInfo}>
                <Text
                    bold
                    numberOfLines={2}
                    style={styles.hospitalName}>{this.state.name}</Text>
                <Text
                    numberOfLines={2}
                    semiBold
                    style={styles.welcomeText}>{this.state.slogan}</Text>
            </View>
        </View >
    }

    onPressServiceItem = async (service) => {
        this.setState({ isFetching: true })
        try {
            const response = await ManagerApi.add({ lane: service._id })
            if (response?.status === 200) {
                const numberTicket = response?.data?.ticket?.number
                this.setState({
                    message: `Number ticket: ${numberTicket}`,
                    showAlert: true
                }, this.setTimeoutMessage)
                this.printTicket(numberTicket, service)
                this.setState({ isFetching: false })
            }
        } catch (e) {
            this.setState({ isFetching: false })
            console.error("add error", e)
        }

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
        const { lanes } = this.state
        if (!lanes) return null
        return <View>
            <FlatList
                numColumns={2}
                data={lanes}
                keyExtractor={(item, index) => `${item.id}${index}`}
                renderItem={this.renderItem}
                showsVerticalScrollIndicator={false}
                style={[styles.serviceList, {
                    maxHeight: this.maxServiceListHeight
                }]} />
        </View>

    }

    renderSwiper = () => {
        if (!this.state.banner) return null
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
                        {this.state.banner?.map((uri) => {
                            return <FastImage
                                key={`${uri}`}
                                resizeMode={'cover'}
                                source={{ uri: resolveImagePath(uri) }}
                                style={{ flex: 1 }} />
                        })}
                    </Swiper>
                </View>
            </View>)
    }

    render() {
        const { message, showAlert, lanes } = this.state
        if (!lanes) return <View
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