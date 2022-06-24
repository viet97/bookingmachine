import { find, isString, size, split } from 'lodash'
import React, { Component } from 'react'
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    View,
    DeviceEventEmitter,
    NativeModules,
    Dimensions
} from 'react-native'
import AwesomeAlert from 'react-native-awesome-alerts'
import FastImage from 'react-native-fast-image'
import Swiper from 'react-native-swiper'
import { SVG } from '../../../assets/svg'
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
            lanes: null,
            printerAttached: false
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
            this.initPrinter()
            return false
        }
        return true
    }

    printTicket = (number, service) => {
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
        if (!this.checkPrinter()) return

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
        this.setState({ printerAttached: true })
        this.initPrinter()
    }

    onPrinterDetached = () => {
        closeConnect()
        this.setState({ printer: false, printerAttached: false })
    }

    alreadyAttachedPrinter = () => {
        closeConnect()
        this.setState({ printerAttached: true })
    }

    componentDidMount() {
        this.fetchData()
        this.listenerKeyDown = DeviceEventEmitter.addListener('onBarcodeScan', this.onBarcodeScan);
        this.printerAttachedListener = DeviceEventEmitter.addListener('onPrinterAttached', this.onPrinterAttached);
        this.printerDetachedListener = DeviceEventEmitter.addListener('onPrinterDetached', this.onPrinterDetached);
        this.alreadyAttachedPrinter = DeviceEventEmitter.addListener('alreadyAttachedPrinter', this.alreadyAttachedPrinter);
    }
    componentWillUnmount() {
        this.listenerKeyDown && this.listenerKeyDown.remove()
        this.listenerKeyDown = null
        this.printerAttachedListener && this.printerAttachedListener.remove()
        this.printerAttachedListener = null
        this.printerDetachedListener && this.printerDetachedListener.remove()
        this.printerDetachedListener = null
        this.alreadyAttachedPrinter && this.alreadyAttachedPrinter.remove()
        this.alreadyAttachedPrinter = null
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
        const { printerAttached, printer } = this.state
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
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center'
                    }}>
                    <Text
                        bold
                        numberOfLines={2}
                        style={styles.hospitalName}>{this.state.name}</Text>
                    <View
                        style={{
                            flexDirection: "row"
                        }}>
                        <Pressable
                            hitSlop={16}
                            style={{
                                marginRight: 32
                            }}>
                            <SVG.printer_connected
                                width={pixel(36)}
                                height={pixel(36)} />
                        </Pressable>
                        <Pressable
                            hitSlop={16}
                            style={{
                                marginRight: 32
                            }}>
                            <SVG.scanner_connected
                                width={pixel(36)}
                                height={pixel(36)} />
                        </Pressable>
                        <Pressable
                            hitSlop={16}
                            style={{
                                marginRight: 32
                            }}>
                            <SVG.cloud_connected
                                width={pixel(36)}
                                height={pixel(36)} />
                        </Pressable>
                        <Pressable
                            hitSlop={16}
                            style={{
                                marginRight: 32
                            }}>
                            <SVG.internet_connected
                                width={pixel(36)}
                                height={pixel(36)} />
                        </Pressable>
                        <Pressable
                            hitSlop={16}
                            style={{
                                marginRight: 32
                            }}>
                            <SVG.power_connected
                                width={pixel(36)}
                                height={pixel(36)} />
                        </Pressable>
                    </View>
                </View>

                <Text
                    numberOfLines={2}
                    semiBold
                    style={styles.welcomeText}>{this.state.slogan}</Text>
            </View>
            {printerAttached && !printer ? <Pressable
                onPress={this.initPrinter}
                hitSlop={16}
                style={styles.printer}>
                <SVG.printer width={24} height={24} color={'black'} />
            </Pressable> : null}
        </View >
    }

    onPressServiceItem = async (service) => {
        if (!this.checkPrinter()) return

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

    renderItem = ({ item, index, width, height, margin, numColumns, rowColumns }) => {
        return (<ServiceItem
            disabled={this.state.isFetching}
            item={item}
            index={index}
            serviceItemWidth={width}
            serviceItemHeight={height}
            serviceItemMargin={margin}
            numColumns={numColumns}
            rowColumns={rowColumns}
            onPressServiceItem={() => this.onPressServiceItem(item)}
        />)
    }

    renderServices = () => {
        const { lanes } = this.state
        if (!lanes) return null
        let numColumns, row
        if (size(data) <= 4) {
            numColumns = 2
            row = 2
        }
        else if (size(data) <= 6) {
            numColumns = 3
            row = 2
        } else if (size(data) <= 9) {
            numColumns = 3
            row = 3
        }
        else if (size(data) <= 12) {
            numColumns = 4
            row = 4
        }
        const itemMargin = pixel(24)
        const listHeight = Dimensions.get("window").height - pixel(192)
        const listWidth = Dimensions.get("window").width - pixel(64)
        const itemWidth = (listWidth - itemMargin * (numColumns - 1)) / numColumns
        const itemHeight = (listHeight - itemMargin * (row - 1)) / row
        return <View
            style={{
                padding: pixel(32),
                flex: 1,
            }}>
            <FlatList
                numColumns={numColumns}
                data={lanes}
                keyExtractor={(item, index) => `${item.id}${index}`}
                renderItem={({ item, index }) => this.renderItem({ item, index, width: itemWidth, height: itemHeight, margin: itemMargin, numColumns, rowColumns: row })}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    flex: 1
                }}
                style={styles.serviceList} />
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

    renderPrinting = () => {
        return null
        return (<View
            style={{
                backgroundColor: "#2368E8",
                ...StyleSheet.absoluteFillObject,
                alignItems: 'center',
                justifyContent: "flex-end"
            }}>
            <Text
                bold
                style={{
                    fontSize: pixel(96),
                    lineHeight: pixel(144),
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    color: Colors.white
                }}>
                đang in vé...
            </Text>
            <Text
                bold
                style={{
                    fontSize: pixel(64),
                    lineHeight: pixel(112),
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    color: Colors.white,
                }}>
                nhận vé ở khe bên dưới
            </Text>
            <SVG.printing width={pixel(616)} />
        </View>)
    }

    render() {
        const { message, showAlert, lanes } = this.state
        if (!lanes) return <View
            style={styles.containerLoading}>
            <ActivityIndicator size={"large"} />
        </View>
        return (
            <View
                style={styles.container}>
                <View
                    style={styles.container}>
                    {this.renderHeader()}
                    <View
                        style={{
                            flex: 1
                        }}>
                        {this.renderServices()}
                        {this.renderSwiper()}
                        {this.renderPrinting()}
                    </View>
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
            </View>
        )
    }
}


const styles = StyleSheet.create({
    printer: {
        position: 'absolute',
        bottom: 0,
        left: 32
    },
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
        backgroundColor: Colors.white,
    },
    serviceList: {
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
        letterSpacing: 0.05,
        flex: 1
    },
    headerInfo: {
        marginLeft: pixel(24),
        flex: 1,
    },
    logo: {
        width: pixel(158),
        height: pixel(158),
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: 'center',
        width: '100%',
        paddingTop: pixel(32),
    },
})