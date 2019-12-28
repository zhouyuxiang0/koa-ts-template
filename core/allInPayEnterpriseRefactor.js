const crypto = require('crypto');
const moment = require('moment');
const qs = require('querystring')
const request = require('request');
const os = require('os');
// const mainDB = require('winner-common/mysql/databases/mainDB');

class AllInPay {
    constructor(option) {
        this.host = option.host;
        this.privateKey = option.privateKey.toString();
        this.publicKey = option.publicKey.toString();
        this.sysId = option.sysId;
        this.menHost = option.menHost;
        this.accountSetNo = option.accountSetNo;
        this.backUrl = option.backUrl;
        this.industryCode = option.industryCode;
        this.industryName = option.industryName;
        this.subAppid = option.subAppid;
    }

    _getCommonParams() {
        return {
            sysid: this.sysId,
            timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
            v: '2.0',
        }
    }

    _logger(text) {
        console.log(text)
    }

    _setLogger(logger) {
        this._logger = logger
    }

    _private_encrypt(param) {
        return crypto.publicEncrypt({
            key: this.publicKey,
            padding: crypto.constants.RSA_PKCS1_PADDING,
        }, Buffer.from(param)).toString('hex').toUpperCase();
    }

    _private_decrypt(param) {
        const verify = crypto.createVerify('RSA-SHA1');
        verify.update(param);
        return verify.verify(this.privateKey);
    }

    _md5(text) {
        return crypto.createHash('md5').update(text).digest('base64');
    }

    _sign(param) {
        const source_str = `${param.sysid}${JSON.stringify(param.req)}${param.timestamp}`;
        const md5_str = crypto.createHash('md5').update(source_str).digest('base64');
        const sign = crypto.createSign('RSA-SHA1');
        sign.update(md5_str, 'utf8');
        return sign.sign(this.privateKey, 'base64');
    }

    _verify(rps) {
        try {
            let signedValue = rps.signedValue;
            const md5_str = crypto.createHash('md5').update(signedValue).digest('base64');// md5 + base64
            const verify = crypto.createVerify('RSA-SHA1');
            verify.update(md5_str, 'utf8');
            return verify.verify(this.publicKey, rps.sign, 'base64');
        } catch (e) {
            return false;
        }
    }

    getUserBingingEnterprise(uid) {
        this.registerMember(uid);
    }

    registerMember(uid) {
        return new Promise((resolve, reject) => {
            let parma = this._createRegisterMemberParam(uid);
            this._requestGet(this.menHost, parma).then(result => {
                resolve(result)
            }).catch(e => {
                reject(e)
            })
        })
    }

    _requestGet(url, option) {
        return new Promise((resolve, reject) => {
            for (let key in option) {
                if (typeof option[key] == 'object') option[key] = JSON.stringify(option[key]);
            }
            let data = {
                url: url,
                method: 'get',
                json: true,
                qs: option
            }
            console.log(option)
            request(data, (err, response, body) => {
                this._logger(`请求|${JSON.stringify(option)}\n响应|${JSON.stringify(body)}`)
                if (err) reject('无效请求');
                let verifyResult = this._verify(body);
                if (!verifyResult) reject('签名验证失败');
                if (body.status == 'OK') resolve(JSON.parse(body.signedValue));
                reject(`${body.message}(${body.errorCode})`);
            })
        })
    }

    _createRegisterMemberParam(uid) {
        let option = {
            ...this._getCommonParams(),
            req: {
                service: 'MemberService',
                method: 'createMember',
                param: {
                    bizUserId: this._md5(uid),
                    memberType: '3',
                    source: '1',
                }
            }
        }
        option.sign = this._sign(option)
        return option;
    }

    _createRefundServiceParam(options) {
        let option = {
            ...this._getCommonParams(),
            req: {
                service: 'OrderService',
                method: 'refund',
                param: {
                    bizOrderNo: options.orderId,
                    oriBizOrderNo: options.oriOrderId,
                    bizUserId: this._md5(options.uid),
                    backUrl: this.backUrl,
                    amount: parseInt(options.money * 100),
                }
            }
        }
        option.sign = this._sign(option)
        return option;
    }

    refundService (options, callback) {
        return new Promise((resolve, reject) => {
            if (!options || typeof options != 'object' || !options.uid || !options.orderId || !options.oriOrderId || !options.money) return callback('无效参数!');
            let param = this._createRefundServiceParam(options);
            this._requestGet(this.menHost, param).then(result => {
                resolve(result)
            }).catch(e => {
                reject(e)
            })
        }) 
    }

    _createQueryOrderServiceParam(options) {
        let option = {
            ...this._getCommonParams(),
            req: {
                service: 'OrderService',
                method: 'getOrderDetail',
                param: {
                    bizOrderNo: options.orderId
                }
            }
        }
        option.sign = this._sign(option)
        return option;
    }

    queryOrder(options) {
        return new Promise((resolve, reject) => {
            if (!options || typeof options != 'object' || !options.orderId) reject('无效参数!');
            let param = this._createQueryOrderServiceParam(options)
            this._requestGet(this.menHost, param).then(result => {
                resolve(result)
            }).catch(e => {
                reject(e)
            })
        })
    }

    _createCheckAccountFileParam(data) {
        let option = {
            ...this._getCommonParams(),
            req: {
                service: 'MerchantService',
                method: 'getCheckAccountFile',
                param: {
                    date: data
                }
            }
        }
        option.sign = this._sign(option)
        return option;
    }

    getCheckAccountFile(data) {
        return new Promise((resolve, reject) => {
            if (!data) reject('无效时间');
            let param = this._createCheckAccountFileParam(data);
            this._requestGet(this.menHost, param).then(result => {
                resolve(result)
            }).catch(e => {
                reject(e)
            })
        })
    }

    verifyOrder(option) {
        const md5_str = crypto.createHash('md5').update(`${option.sysid}${option.rps}${option.timestamp}`).digest('base64');// md5 + base64
        const verify = crypto.createVerify('RSA-SHA1');
        verify.update(md5_str, 'utf8');
        return verify.verify({
            key: this.publicKey,
            padding: crypto.constants.RSA_PKCS1_PADDING
        }, option.sign, 'base64');
    }

    _createApplyBindAcctParam(options) {
        let option = {
            ...this._getCommonParams(),
            req: {
                service: 'MemberService',
                method: 'applyBindAcct',
                param: {
                    bizUserId: this._md5(options.uid),
                    operationType: 'set',
                    acctType: 'weChatPublic',
                    acct: options.openid,
                }
            }
        }
        option.sign = this._sign(option)
        return option;
    }

    _createSendVerificationCodeParam(options) {
        let option = {
            ...this._getCommonParams(),
            req: {
                service: 'MemberService',
                method: 'sendVerificationCode',
                param: {
                    bizUserId: this._md5(options.uid),
                    // bizUserId: options.uid,
                    phone: options.phone,
                    verificationCodeType: 9,
                }
            }
        }
        option.sign = this._sign(option)
        return option;
    }

    sendVerificationCode(options) {
        return new Promise((resolve, reject) => {
            if (!options || typeof options != 'object' || !options.uid || !options.phone) reject('无效参数!');
            let param = this._createSendVerificationCodeParam(options)
            this._requestGet(this.menHost, param).then(result => {
                resolve(result)
            }).catch(e => {
                reject(e)
            })
        })
    }

    _createBindPhoneParam(options) {
        let option = {
            ...this._getCommonParams(),
            req: {
                service: 'MemberService',
                method: 'bindPhone',
                param: {
                    bizUserId: this._md5(options.uid),
                    // bizUserId: options.uid,
                    phone: options.phone,
                    verificationCode: options.code,
                }
            }
        }
        option.sign = this._sign(option)
        return option;
    }

    bindPhone(options) {
        return new Promise((resolve, resject) => {
            if (!options || typeof options != 'object' || !options.uid || !options.phone || !options.code) reject('无效参数!');
            let param = this._createBindPhoneParam(options)
            this._requestGet(this.menHost, param).then(result => {
                resolve(result)
            }).catch(e => {
                reject(e)
            })
        })
    }

    setAllInPayEnterprise(options) {
        return new Promise((resolve, reject) => {
            let param = this._createSetAllInPayEnterprise(options)
            this._requestGet(this.menHost, param).then(result => {
                resolve(result)
            }).catch(e => {
                reject(e)
            })
        })
    }

    _createSetAllInPayEnterprise(options) {
        let legalIds = this._rsaEncrypt(options.legalIds)
        let accountNo = this._rsaEncrypt(options.accountNo)
        let option = {
            ...this._getCommonParams(),
            req: {
                service: 'MemberService',
                method: 'setCompanyInfo',
                param: {
                    bizUserId: this._md5(options.uid),
                    backUrl: this.backUrl,
                    companyBasicInfo: {
                        companyName: options.companyName,//企业名称
                        companyAddress: options.companyAddress || '',//企业地址
                        authType: 2,
                        uniCredit: options.uniCredit,
                        businessLicense: options.businessLicense,//营业执照号（三证）
                        organizationCode: options.organizationCode,//组织机构代码（三证）
                        taxRegister: options.taxRegister,//税务登记证（三证）
                        expLicense: options.expLicense,//统一社会信用/营业执照号到期时 间
                        telephone: "",//联系电话
                        legalName: options.legalName,//法人姓名
                        identityType: 1,//法人证件类型
                        legalIds: legalIds,// 法人证件号码
                        legalPhone: options.legalPhone,//法人手机号码
                        accountNo: accountNo,//企业对公账户账号
                        parentBankName: options.parentBankName,//开户银行名称
                        bankCityNo: options.bankCityNo,// 开户行地区代码
                        bankName: options.bankName,//开户行支行名称
                        unionBank: options.unionBank,//支付行号，12 位数字
                        province: options.province || '',//开户行所在省,
                        city: options.city || '',//开户行所在市,
                    },
                    isAuth: true
                }
            }
        }
        option.sign = this._sign(option)
        return option;
    }

    _rsaEncrypt(str) {
        let encrypt = crypto.publicEncrypt({
            key: this.publicKey,
            padding: crypto.constants.RSA_PKCS1_PADDING
        }, Buffer.from(str))
        return encrypt.toString("hex").toUpperCase();
    }

    setRealName(options) {
        return new Promise((resolve, reject) => {
            let param = this._createSetRealName(options)
            this._requestGet(this.menHost, param).then(result => {
                resolve(result)
            }).catch(e => {
                reject(e)
            })
        })
    }

    _createSetRealName(options) {
        let option = {
            ...this._getCommonParams(),
            req: {
                service: 'MemberService',
                method: 'setRealName',
                param: {
                    bizUserId: this._md5(options.uid),
                    isAuth: true,
                    name: options.name,
                    identityType: 1,
                    identityNo: this._rsaEncrypt(options.identityNo)
                }
            }
        }
        option.sign = this._sign(option)
        return option;
    }

    bnindByHtml(options) {
        return 'https://fintech.allinpay.com/yungateway/member/signContract.html?' + qs.stringify(this._createBnindByHtml(options))
    }

    _createBnindByHtml(options) {
        let option = {
            ...this._getCommonParams(),
            req: {
                service: 'MemberService',
                method: 'signContract',
                param: {
                    bizUserId: this._md5(options.uid),
                    backUrl: this.backUrl,
                    jumpUrl: this.backUrl,
                    source: 2
                }
            }
        }
        option.sign = this._sign(option)
        for (let key in option) {
            if (typeof option[key] == 'object') option[key] = JSON.stringify(option[key]);
        }
        return option
    }

    bindCardRequest(options) {
        return new Promise((resolve, reject) => {
            let param = this._createBindCardRequest(options)
            this._requestGet(this.menHost, param).then(result => {
                resolve(result)
            }).catch(e => {
                reject(e)
            })
        })
    }

    _createBindCardRequest(options) {
        let option = {
            ...this._getCommonParams(),
            req: {
                service: 'MemberService',
                method: 'applyBindBankCard',
                param: {
                    bizUserId: this._md5(options.uid),
                    cardNo: this._rsaEncrypt(options.cardNo),
                    phone: options.phone,
                    name: options.name,
                    cardCheck: "8",
                    identityType: 1,
                    identityNo: this._rsaEncrypt(options.identityNo),
                    validate: options.validate || '',
                    cvv2: options.cvv2 || '',
                    isSafeCard: false,
                    unionBank: options.unionBank || '',
                }
            }
        }
        option.sign = this._sign(option)
        return option;
    }

    affirmBindCard(options) {
        return new Promise((resolve, reject) => {
            let param = this._createAffirmBindCard(options)
            this._requestGet(this.menHost, param).then(result => {
                resolve(result)
            }).catch(e => {
                reject(e)
            })
        })
    }

    _createAffirmBindCard(options) {
        let option = {
            ...this._getCommonParams(),
            req: {
                service: 'MemberService',
                method: 'bindBankCard',
                param: {
                    bizUserId: this._md5(options.uid),
                    tranceNum: options.tranceNum,
                    transDate: options.transDate,
                    phone: options.phone,
                    validate: options.validate || '',
                    cvv2: options.cvv2 || '',
                    verificationCode: options.code
                }
            }
        }
        option.sign = this._sign(option)
        return option;
    }

    withdrawApply(options) {
        return new Promise((resolve, reject) => {
            let param = this._createwithdrawApply(options)
            this._requestGet(this.menHost, param).then(result => {
                resolve(result)
            }).catch(e => {
                reject(e)
            })
        })
    }

    _createwithdrawApply(options) {
        let option = {
            ...this._getCommonParams(),
            req: {
                service: 'OrderService',
                method: 'withdrawApply',
                param: {
                    bizOrderNo: options.orderId,
                    bizUserId: this._md5(options.uid),
                    accountSetNo: this.accountSetNo,
                    amount: parseInt(options.amount * 100),
                    fee: 0,
                    validateType: "0",
                    backUrl: this.backUrl,
                    orderExpireDatetime: moment(new Date().getTime() + 1000 * 60 * 5).format('YYYY-MM-DD HH:mm:ss'),
                    payMethod: "",
                    bankCardNo: this._rsaEncrypt(options.cardNo),
                    bankCardPro: 0,
                    withdrawType: "D0",
                    industryCode: this.industryCode,
                    industryName: this.industryName,
                    source: "2",
                    summary: "",
                    extendInfo: "",
                }
            }
        }
        option.sign = this._sign(option)
        return option;
    }

    queryBalance(options) {
        return new Promise((resolve, reject) => {
            let param = this._createqueryBalance(options)
            this._requestGet(this.menHost, param).then(result => {
                resolve(result)
            }).catch(e => {
                reject(e)
            })
        })
    }

    _createqueryBalance(options) {
        let option = {
            ...this._getCommonParams(),
            req: {
                service: 'OrderService',
                method: 'queryBalance',
                param: {
                    bizUserId: this._md5(options.uid),
                    accountSetNo: this.accountSetNo,
                }
            }
        }
        option.sign = this._sign(option)
        return option;
    }

}

let a1909101208345001592 = new AllInPay({
    privateKey: "-----BEGIN RSA PRIVATE KEY-----" + os.EOL +
        "MIICXAIBAAKBgQChM5AJWMTJk96itItXpkh0+ZTN0I5e5iOFoKbuHCv5q3GHmD2j7DeJjMxHafuSBsfOGg9kXBFuIFb4ENtvlh89PdKWrjL9y4ssZotmGpqOlYqj8gR1Py7hn4z7XhdEb8l+Hzvg5zn/ZTRT3U1MnKaeJYBOck+A7UXKgsakov492QIDAQABAoGAN6c3mSJ+fiGBAadXXCFabpgkGZJhNL47kUzPlPFA9WeNQIT88vUAj4p+lEEwy09v9+XjXoCyu9SKcgZP3Ax2KAAxKgPmehKj3cL7FCZUcF00mTbuSF4eS18HFLNLs8T0FJ9arywddhVi2zb0lFZ6sJtc18HWjywat+eEHekTqUkCQQDSCPrQ/i7wLQR3Ktc/zElHmq3v71T5ZkJ2lVZs4uIrOSJxwupoZOLR2D0BHJcY4PonfGWGFkKVZ+BtOYKKGk+jAkEAxHq47hq9a4lq87wrXMdzm2hXdAY+hdaifn/OGYwakn/SPIozOOErqNLoENmSykWYKCI+ET2lDEmsPKdYB+akUwJBALwDwdJX11i0U60BMpIvouFwO4fu7FgdDB3u7OCn8OHUUVsYqpEszkYele1q1G825Xd3ScJQJuZriGD9/Db3+pUCQDosS8zTxfms+imoMP6LX0NIJXyIzMI7xmjF1nPh84wkpE6gbIIOySp3J5a1lKym5mIboVzhb5ivx3s94OaV91kCQGxaRwi7F8JqczqoUPPzweFA8gyaRbG69Ndjn76h+mCKsYLKgASNS0DaASgLcDOLoOy0PPIWauQtypB5dzqREZw="
        + os.EOL + "-----END RSA PRIVATE KEY-----",
    publicKey: '-----BEGIN PUBLIC KEY-----' + os.EOL +
        "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDUucCNCbCM2KGIRrR+MuzxdBwcsEdIlP+bkP50yufEiIHqAGKleCFIQVhVi23TGEqAcHb1FCOE6RBdXc/E9cfBBYuwfSu6RA50FABJhXBW3aS546tmyaTfOLHOKR+NvFe8Q2cRb+jRKJCP2MGxGpBxifXcfJ1pTFLSWE3DngR96wIDAQAB"
        + os.EOL + '-----END PUBLIC KEY-----',
    sysId: '1909101208345001592',
    host: 'https://fintech.allinpay.com /yungateway/frontTrans.do',
    menHost: 'https://fintech.allinpay.com/service/soa',
    accountSetNo: '400212',//账户集编号
    // backUrl: 'https://allinpay.epaynfc.com/back',
    backUrl: 'http://121.40.172.190:3952/test',
    industryCode: '1910',//行业代码
    industryName: '其他',//行业名称
})

module.exports = {
    '1909101208345001592': a1909101208345001592
}