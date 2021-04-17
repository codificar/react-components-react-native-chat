/* eslint-disable @typescript-eslint/explicit-function-return-type */
import axios from 'axios';

/**
 * Get conversation in request
 * @param {string} url
 * @param {number} id
 * @param {string} token
 * @param {number} request_id
 */
export function getConversation(url, id, token, request_id) {
  return axios.get(`${url}/api/libs/chat/conversation`, {
    params: {
      id,
      token,
      request_id,
    },
  });
}

/**
 * Get messages in conversation request
 * @param {string} url
 * @param {number} id
 * @param {string} token
 * @param {number} conversation_id
 */
export function getMessageChat(url, id, token, conversation_id) {
  return axios.get(`${url}/api/libs/chat/messages`, {
    params: {
      id,
      token,
      conversation_id,
    },
  });
}

/**
 * Set message as see
 * @param {string} url
 * @param {number} id
 * @param {string} token
 * @param {number} message_id
 */
export function seeMessage(url, id, token, message_id) {
  const formdata = new FormData();

  formdata.append('id', id);
  formdata.append('token', token);
  formdata.append('message_id', message_id);

  console.log('form: ', formdata);
  return axios.post(`${url}/api/libs/chat/seen`, formdata);
}

/**
 * Send new message in request
 * @param {string} url
 * @param {number} id
 * @param {string} token
 * @param {number} request_id
 * @param {string} message
 * @param {number} receiver_id
 * @param {string} type
 */
export function sendMessage(
  url,
  id,
  token,
  request_id,
  message,
  receiver_id,
  type = 'text',
) {
  return axios.post(`${url}/api/libs/chat/send`, {
    id,
    token,
    request_id,
    message,
    receiver_id,
    type,
  });
}

/**
 * Send messages for a help chat conversation
 * @param {*} id
 * @param {*} token
 * @param {*} message
 * @param {*} request_id
 */
export function sendMessageHelpChat(url, id, token, message, request_id) {
  return axios.post(`${url}/api/libs/set_help_message`, {
    id,
    token,
    message,
    request_id,
  });
}

/**
 * Retrieve messages from help chat conversation
 * @param {*} id
 * @param {*} token
 * @param {*} request_id
 */
export function getMessageHelpChat(url, id, token, request_id) {
  return axios.get(`${url}/api/libs/get_help_message`, {
    params: {
      id,
      token,
      request_id,
    },
  });
}

/**
 * List providers ro send direct message
 * @param {string} url
 * @param {number} id
 * @param {string} token
 * @param {string} name
 */
export function listProvidersForConversation(url, id, token, name) {
  return axios.get(`${url}/api/libs/get_providers_chat`, {
    params: {
      id,
      token,
      name,
    },
  });
}

/**
 * List direct conversation of an user
 * @param {string} url
 * @param {number} id
 * @param {string} token
 */
export function listDirectConversations(url, id, token) {
  return axios.get(`${url}/api/libs/list_direct_conversation`, {
    params: {
      id,
      token,
    },
  });
}

/**
 * Get messages in direct conversation
 * @param {string} url
 * @param {number} id
 * @param {string} token
 * @param {number} receiver
 */
export function getMessageDirectChat(url, id, token, receiver) {
  return axios.get(`${url}/api/libs/get_direct_message`, {
    params: {
      id,
      token,
      receiver,
    },
  });
}

/**
 * Send new message in direct converation
 * @param {string} url
 * @param {number} id
 * @param {string} token
 * @param {number} receiver
 * @param {string} message
 */
export function sendMessageDirectChat(url, id, token, receiver, message) {
  return axios.post(`${url}/api/libs/set_direct_message`, {
    id,
    token,
    receiver,
    message,
  });
}
