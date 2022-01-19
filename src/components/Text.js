import React, { PureComponent } from 'react';
import { Text as RNText } from 'react-native';

export const FONT_FAMILY = {
    bold: 'Montserrat-Bold',
    semiBold: 'Montserrat-SemiBold',
    regular: 'Montserrat-Regular',
}

class Text extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {};
    }
    render() {
        const {
            bold,
            semiBold,
            style,
            ...otherProps
        } = this.props;
        let fontFamily = FONT_FAMILY.regular;
        if (bold) {
            fontFamily = FONT_FAMILY.bold
        }
        if (semiBold) {
            fontFamily = FONT_FAMILY.semiBold
        }
        return (
            <RNText
                {...otherProps}
                style={[style, { fontFamily }]}
            />
        );
    }
}

export default Text;
