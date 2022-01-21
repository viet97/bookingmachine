import React, { Component } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import Text from '../../components/Text'
import ManagerApi from '../../services/ManagerApi'
import { Colors } from '../../themes/Colors'
import { pixel } from '../../utils/DeviceUtil'

export default class ServiceItem extends Component {
    constructor(props) {
        super(props)
        this.state = {
            isLoading: false
        }
    }
    onPressService = async () => {
        const { onPressServiceItem } = this.props
        try {
            this.setState({ isLoading: true })
            await onPressServiceItem()
        } catch (error) {
            console.error("onPressServiceItem", e)
        }
        this.setState({ isLoading: false })
    }

    render() {
        const { item, index, serviceItemWidth, disabled, serviceItemMargin } = this.props
        const { isLoading } = this.state
        const isFirstColumn = index % 2 === 0
        const isFirstRow = index <= 1
        const dynamicStyle = {
            marginTop: isFirstRow ? 0 : serviceItemMargin,
            marginRight: isFirstColumn ? serviceItemMargin : 0,
            width: serviceItemWidth,
        }
        return (<Pressable
            disabled={isLoading || disabled}
            onPress={this.onPressService}
            style={[styles.serviceItem, dynamicStyle]}>
            <FastImage
                resizeMode="cover"
                source={{ uri: item.backgroundUrl }}
                style={[styles.serviceBg, { width: serviceItemWidth }]} />
            <View
                style={styles.serviceItemOverlay} />
            {isLoading ?
                <ActivityIndicator
                    color={Colors.white}
                    size={'large'}
                /> : <Text
                    style={styles.serviceName}>
                    {item.name}
                </Text>}
        </Pressable>)
    }
}


const styles = StyleSheet.create({
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
})