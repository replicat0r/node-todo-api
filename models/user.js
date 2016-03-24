var bcrypt = require('bcrypt')
var _ = require('underscore')
var cryptojs = require('crypto-js')
var jwt = require('jsonwebtoken')
module.exports = function(sequelize, DataTypes) {
    var user = sequelize.define('user', {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        salt: {
            type: DataTypes.STRING
        },
        password_hash: {
            type: DataTypes.STRING
        },
        password: {
            type: DataTypes.VIRTUAL,
            allowNull: false,
            validate: {
                len: [7, 100]
            },
            set: function(value) {
                var salt = bcrypt.genSaltSync(10);
                var hashedPassword = bcrypt.hashSync(value, salt);
                this.setDataValue('password', value)
                this.setDataValue('salt', salt)
                this.setDataValue('password_hash', hashedPassword)
            }
        }
    }, {
            hooks: {
                beforeValidate: function(user, options) {
                    if (typeof user.email === "string") {
                        user.email = user.email.toLowerCase()
                    }
                }
            },
            instanceMethods: {
                toPublicJSON: function() {
                    var json = this.toJSON();
                    return _.pick(json, "id", "email", 'created_at', 'updated_at')
                },
                generateToken: function(type) {
                    if (!_.isString(type)) {
                        return undefined
                    }
                    try {
                        var stringData = JSON.stringify({ id: this.get('id'), type: type })

                        var encrypteData = cryptojs.AES.encrypt(stringData, 'abc1234').toString();
                        var token = jwt.sign({
                            token: encrypteData
                        }, 'qwerty098')

                        debugger;
                        return token;

                    } catch (e) {
                        console.log(e)
                        return undefined
                    }

                }
            },
            classMethods: {
                authenticate: function(body) {
                    return new Promise(function(resolve, reject) {
                        if ((typeof body.email !== 'string') && (typeof body.password !== 'string')) {
                            return reject();
                        }
                        user.findOne({
                            where: {
                                email: body.email
                            }
                        }).then(function(user) {
                            if (!user || !bcrypt.compareSync(body.password, user.get('password_hash'))) {
                                return reject();
                            }
                            resolve(user)

                        }, function(err) {
                            return reject();
                        })
                    })
                },
                findByToken: function(token) {
                    return new Promise(function(resolve, reject) {
                        try {
                            var decodedJWT = jwt.verify(token, 'qwerty098');
                            var bytes = cryptojs.AES.decrypt(decodedJWT.token, 'abc1234')
                            //bytes outputs value in hex because it doesnt know what encoding is used from the original value,
                            //toString() is a custom method on the cryptoJs that can accept char encoding to decrypt the string
                            var tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));
                            user.findById(tokenData.id).then(function(user) {
                                if (user) {
                                    resolve(user)
                                } else {
                                    reject();
                                }
                            }, function(e) {
                                reject();

                            })

                        } catch (e) {
                            reject();

                        }
                    });
                }
            }
        })

    return user;
}