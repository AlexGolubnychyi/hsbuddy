import * as Promise from 'bluebird';
import { cardDB, CardDB } from '../db/card';
import { getContent, getJSON } from '../lib/request';
import * as hsTypes from '../../interfaces/hs-types';
import mongoose from '../lib/mongoose';

const hearthPwnUrl = 'http://www.hearthpwn.com/cards?page=@@@';
const hearthPwnUrlExt = 'http://www.hearthpwn.com/cards?display=1&filter-premium=1&page=@@@';

interface cardHash {
    [id: string]: CardDB;
}

export function parseCards() {
    return loadBasicInfo()
        .then(getAdditionalCardInfo)
        .then(getHsDbStats)
        .then(saveAll);

}

function loadBasicInfo() {
    const cnt = 80,
        urls = new Array(cnt).join(',').split(',').map((_, inx) => hearthPwnUrl.replace('@@@', (inx + 1) + '')),
        cards: cardHash = {};

    return Promise.map(urls, cardUrl => getContent(cardUrl), { concurrency: 3 })
        .map(($: CheerioStatic) => {
            $('table.listing.cards-visual.listing-cards>tbody tr').each((inx, el) => {
                let $tr = $(el),
                    card = new cardDB(),
                    token = false;

                card.name = $tr.find('h3').text().trim();
                card.description = $tr.find('.visual-details-cell>p').text().trim();
                card.flavorText = $tr.find('.card-flavor-listing-text').text().trim();
                card.img = $tr.find('.visual-image-cell img').attr('src');
                card.class = hsTypes.CardClass.neutral;
                card.type = hsTypes.CardType.unknown;
                card.rarity = hsTypes.CardRarity.unknown;
                card.cardSet = hsTypes.CardSet.unknown;
                card.race = hsTypes.CardRace.none;
                card.url = 'http://www.hearthpwn.com' + $tr.find('.visual-image-cell>a').attr('href');
                card.cost = 0;
                card.mana = 0;

                $tr.find('.visual-details-cell>ul>li').each((_, li) => {
                    const $li = $(li);

                    if ($li.text().indexOf('Type:') !== -1) {
                        card.type = hsTypes.CardType[$li.find('a').text().trim().toLowerCase()] || card.type;
                        return;
                    }

                    if ($li.text().indexOf('Class:') !== -1) {
                        card.class = (hsTypes.hsTypeConverter.cardClass($li.find('a').text()) as hsTypes.CardClass) || card.class;
                        return;
                    }

                    if ($li.text().indexOf('Rarity:') !== -1) {
                        card.rarity = hsTypes.CardRarity[$li.find('a').text().trim().toLowerCase()] || card.rarity;
                        return;
                    }

                    if ($li.text().indexOf('Set:') !== -1) {
                        card.cardSet = <hsTypes.CardSet>hsTypes.hsTypeConverter.cardSet($li.find('a').text());
                        return;
                    }

                    if ($li.text().indexOf('Race:') !== -1) {
                        card.race = hsTypes.CardRace[$li.find('a').text().trim().toLowerCase()] || card.race;
                        return;
                    }

                    if ($li.text() === 'Token') {
                        token = true;
                        return;
                    }

                    if ($li.text().indexOf('Cost to Craft:') !== -1) {
                        card.cost = +$li.text().match(/([0-9]+)/g)[0];
                        return;
                    }
                });

                if (typeof card.cost === 'undefined') {
                    card.cost = hsTypes.hsTypeConverter.getCardCost(card.rarity);
                    // 2 very special cards, thanks WOG
                    if (card._id === 'cthun' || card._id === 'beckonerofevil') {
                        card.cost = 0;
                    }
                }

                if ([
                    hsTypes.CardSet.Basic,
                    hsTypes.CardSet.BlackrockMountain,
                    hsTypes.CardSet.LeagueOfExplorers,
                    hsTypes.CardSet.OneNightInKarazhan
                ].indexOf(card.cardSet) >= 0) {
                    card.cost = 0;
                }


                if (card.cardSet === +hsTypes.CardSet.Basic) {
                    card.rarity = hsTypes.CardRarity.free;
                }

                if (!card.name || token || +card.type === +hsTypes.CardType.hero) {
                    console.log(`[skipped] token/hero: ${card.name}`);
                    return;
                }
                card._id = cardDB.generateId(card.name);
                cards[card._id] = card;
            });
        })
        .then(() => (console.log('basic card info from hearthpwn loaded'), cards));
}

function getAdditionalCardInfo(cards: cardHash) {
    const cnt = 15,
        urls = new Array(cnt).join(',').split(',').map((_, inx) => hearthPwnUrlExt.replace('@@@', (inx + 1) + ''));

    return Promise
        .map(urls, cardUrl => getContent(cardUrl), { concurrency: 3 })
        .map(($: CheerioStatic) => {
            $('table.listing.listing-cards-tabular>tbody tr').each((inx, el) => {
                const $tr = $(el),
                    name = $tr.find('.col-name').text().trim(),
                    mana = +$tr.find('.col-cost').text().trim() || 0,
                    attack = +$tr.find('.col-attack').text().trim() || 0,
                    health = +$tr.find('.col-health').text().trim() || 0,
                    card = cards[cardDB.generateId(name)];

                if (!card) {
                    console.log(`card not found ${name}`);
                    return;
                }

                card.mana = mana;
                if (card.type === hsTypes.CardType.minion) {
                    card.attack = attack;
                    card.health = health;
                }

            });
        })
        .all()
        .then(() => {
            console.log('additional info collected');
            return cards;
        });
}

function getHsDbStats(cards: cardHash) {
    return getJSON('https://api.hearthstonejson.com/v1/latest/enUS/cards.collectible.json')
        .then((hsJson: HSJSONCard[]) => {
            const hash: { [index: string]: HSJSONCard } = {};
            hsJson.forEach(cardJson => {
                if (cardJson.set === 'HERO_SKINS'){
                    return;
                }
                hash[cardDB.generateId(cardJson.name)] = cardJson;
            });

            Object.keys(cards).map(cardId => cards[cardId]).forEach(c => {
                const cardJson = hash[c._id];
                if (!cardJson) {
                    console.log(`HearthstoneJSON: card not found ${c.name}`);
                    return;
                }
                c.dbfId = cardJson.dbfId;
                c.officialId = cardJson.id;
                c.keywords = [c.name, cardJson.race, ...(cardJson.mechanics || []), cardJson.rarity, cardJson.type, c.description]
                    .filter(keyword => !!keyword).join('$$$').toLocaleUpperCase();
                c.mana = cardJson.cost;
                if (c.type === hsTypes.CardType.minion) {
                    c.attack = cardJson.attack;
                    c.health = cardJson.health;
                    if (!c.race && cardJson.race) {
                        c.race = hsTypes.CardRace[cardJson.race.toLowerCase()] || c.race;
                    }
                }

            });
            return cards;
        });
}

function saveAll(cards: cardHash) {
    return cardDB
        .insertMany(Object.keys(cards).map(key => cards[key]))
        .then(() => {
            console.log('[done] cards saved successfully');
        }).catch(e => {
            console.log(e);
        });
}


export interface HSJSONCard {
    'id': string;
    'dbfId': number;
    'name': string;
    'text': string;
    'flavor': string;
    'artist': string;
    'attack': number;
    'cardClass': string;
    'collectible': boolean;
    'cost': number;
    'elite': boolean;
    'faction': string;
    'health': number;
    'mechanics': string[];
    'rarity': string;
    'set': string;
    'type': string;

    'race': string;
}
