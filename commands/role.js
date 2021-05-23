
//Role command. adds/removes given role from given user

const utils = require('../utils.js');
const prefix = utils.config.prefix;

let name = 'role'
let description = 'Adds/Removes a(the) given role(s) from a given user. Admin only.'

module.exports = {
    name: name,
    description: description,
    alias: false,
    args: true,
    usage: `\`${prefix}role <add/remove> <user> <role>\``,
    admin: true,
    botadmin: true,
    server: true,
    execute(params) {
        switch (params.args[0]) {
            case 'add': {
                mem = utils.findMemberFromGuild(params.args[1], params.msg.guild);
                if (!mem) { return params.msg.reply('User not found!').catch(() => {
                    return params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`${mem} User not found!`) })
                };
                if (params.args.length > 3) {
                    var rolesToFind = params.args.splice(2, (params.args.length-2));
                    var roles = [];
                    for (const name of rolesToFind) {
                        var roleToAdd = utils.findRoleFromGuild(name, params.msg.guild);
                        if (!roleToAdd === false) {
                            roles.splice((roles.length), 0, roleToAdd);
                        };
                    };
                    var rolenames = []
                    for (const r of roles) { rolenames.splice((rolenames.length), 0, r.name); };
                    params.msg.reply(`Adding roles: \`${rolenames}\`\n to User: \`${mem.user.username}\``).catch(() => {
                        params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`${mem} Adding roles: \`${rolenames}\`\n to User: \`${mem.user.username}\``)
                    });
                    add(mem, roles);
                }
                else {
                    var role = utils.findRoleFromGuild(params.args[2], params.msg.guild);
                    if (!role === false) {
                        params.msg.reply(`Adding role: \`${role.name}\`\n to User: \`${mem.user.username}\``).catch(() => {
                            params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`${mem} Adding role: \`${role.name}\`\n to User: \`${mem.user.username}\``)
                        });
                        add(mem, role);
                    }
                    else { 
                        return params.msg.reply('Role not found!').catch(() => {
                            params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`${mem} Role not found!`)
                        }); 
                    };
                };
                break;
            };
            case 'remove': {
                mem = utils.findMemberFromGuild(params.args[1], params.msg.guild);
                if (!mem) {
                    return params.msg.reply('User not found!').catch(() => {
                        params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`${mem} User not found!`)
                    });
                };
                if (params.args.length > 3) {
                    var rolesToFind = params.args.splice(2, (params.args.length-2));
                    var roles = [];
                    for (const name of rolesToFind) {
                        var roleToRem = utils.findRoleFromGuild(name, params.msg.guild);
                        if (!roleToRem === false) {
                            roles.splice((roles.length), 0, roleToRem);
                        };
                    }; var rolenames = []
                    for (const r of roles) { rolenames.splice((rolenames.length), 0, r.name); };
                    params.msg.reply(`Removing roles: \`${rolenames}\`\n from User: \`${mem.user.username}\``).catch(() => {
                        params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`${mem} Removing roles: \`${rolenames}\`\n from User: \`${mem.user.username}\``)
                    });
                    rem(mem, roles);
                }
                else {
                    var role = utils.findRoleFromGuild(params.args[2], params.msg.guild);
                    if (!role === false) {
                        params.msg.reply(`Removing role: \`${role.name}\` from user \`${mem.user.username}\``).catch(() => {
                            params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`${mem} Removing role: \`${role.name}\` from user \`${mem.user.username}\``)
                        });
                        rem(mem, role);
                    }
                    else {
                        return params.msg.reply('Role not found!').catch(() => {
                            params.bot.guild.channels.cache.get(params.bot.defaultTextChannel.id).send(`${mem} Role not found!`)
                        });
                    };
                };
                break;
            };
        };
    },
    regJSON: {
        name: name,
        description: description,
        options: [
            {
                name: 'action',
                description: 'Add or remove.',
                type: 3,
                required: true,
                choices: [
                    { name: 'add', value: 'add' },
                    { name: 'remove', value: 'remove' }
                ]
            },
            {
                name: 'user',
                description: 'User to add or remove roles from.',
                type: 3,
                required: true
            },
            {
                name: 'roles',
                description: 'roles to add or remove.',
                type: 3,
                required: true
            }
        ]
    }
};

function add(mem, roleRes) {
    mem.roles.add(roleRes);
};

function rem(mem, roleRes) {
    mem.roles.remove(roleRes);
};