// server/src/services/trialsService.js
const axios = require('axios');

const BASE = 'https://clinicaltrials.gov/api/v2/studies';

const normalizeTrial = (study) => {
  const proto  = study.protocolSection || {};
  const id     = proto.identificationModule || {};
  const status = proto.statusModule || {};
  const eligib = proto.eligibilityModule || {};
  const contacts = proto.contactsLocationsModule || {};

  const firstContact = contacts.centralContacts?.[0] || {};
  const firstLoc     = contacts.locations?.[0] || {};

  return {
    title:       id.briefTitle || '',
    status:      status.overallStatus || '',
    eligibility: eligib.eligibilityCriteria || '',
    location:    [firstLoc.city, firstLoc.country]
                   .filter(Boolean).join(', '),
    contact:     [firstContact.name, firstContact.phone]
                   .filter(Boolean).join(' · '),
    url:         `https://clinicaltrials.gov/study/${id.nctId}`
  };
};

const getClinicalTrials = async ({ condition, term, location }, pageSize = 50) => {
  let params = `query.cond=${encodeURIComponent(condition)}&pageSize=${pageSize}&format=json`;
  if (term)     params += `&query.term=${encodeURIComponent(term)}`;
  if (location) params += `&query.locn=${encodeURIComponent(location)}`;

  const { data } = await axios.get(`${BASE}?${params}`);
  return (data.studies || []).map(normalizeTrial);
};

module.exports = { getClinicalTrials };
