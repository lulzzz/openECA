﻿//******************************************************************************************************
//  Site.js - Gbtc
//
//  Copyright © 2016, Grid Protection Alliance.  All Rights Reserved.
//
//  Licensed to the Grid Protection Alliance (GPA) under one or more contributor license agreements. See
//  the NOTICE file distributed with this work for additional information regarding copyright ownership.
//  The GPA licenses this file to you under the MIT License (MIT), the "License"; you may not use this
//  file except in compliance with the License. You may obtain a copy of the License at:
//
//      http://opensource.org/licenses/MIT
//
//  Unless agreed to in writing, the subject software distributed under the License is distributed on an
//  "AS-IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. Refer to the
//  License for the specific language governing permissions and limitations.
//
//  Code Modification History:
//  ----------------------------------------------------------------------------------------------------
//  01/15/2016 - J. Ritchie Carroll
//       Generated original version of source code.
//
//******************************************************************************************************

// Hub connectivity and site specific scripts
"use strict";

// Declare page scoped SignalR variables
var dataHub, dataHubClient;
var sharedHub, sharedHubClient;

var hubIsConnecting = false;
var hubIsConnected = false;
var suppressMessages = false;
var errorPanel = null;
var infoPanel = null;

function hideSideBar() {
    $("#pageWrapper").removeClass("toggled");
}

function showSideBar() {
    $("#pageWrapper").addClass("toggled");
}

function toggleSideBar() {
    $("#pageWrapper").toggleClass("toggled");
}

function hideErrorMessage() {
    if (errorPanel)
        errorPanel.close();
}

function hideInfoMessage() {
    if (infoPanel)
        infoPanel.close();
}

function showErrorMessage(message, timeout) {
    errorPanel = $.jsPanel({
        autoclose: timeout,
        template: jsPanel.tplContentOnly,
        paneltype: 'hint',
        position: 'right-top -5 5 DOWN',
        theme: 'red filledlight',
        border: '2px solid',
        contentSize: '500 auto',
        show: 'animated slideInUp',
        content: "<div><i class='fa fa-exclamation' style='margin:auto;'></i></div>" +
                     "<div><p style='margin:auto;'>" + message + "</p></div>" +
                     "<div><i class='fa fa-remove'></i></div>",
        callback: function (panel) {
            this.content.css({
                display: 'flex',
                color: 'darkred'
            });
            $('div:first-of-type', this.content).css({
                borderRadius: '50%',
                display: 'flex',
                fontSize: '36px',
                margin: '12px',
                width: '60px'
            });
            $('div', this.content).eq(1).css({
                display: 'flex',
                fontSize: '16px',
                textAlign: 'center',
                width: 'calc(100% - 126px)'
            });
            $('div', this.content).eq(2).css({
                display: 'flex',
                flexDirection: 'row-reverse',
                alignItems: 'flex-start',
                fontSize: '18px',
                width: '45px',
                padding: '4px'
            });
            $('div', this.content).eq(2).find('i').css({
                cursor: 'pointer'
            }).click(function () { panel.close(); });
        }
    });

}

function showInfoMessage(message, timeout) {
    infoPanel = $.jsPanel({
        autoclose: timeout,
        template: jsPanel.tplContentOnly,
        paneltype: 'hint',
        position: 'right-top -5 5 DOWN',
        theme: 'green filledlight',
        border: '2px solid',
        contentSize: '500 auto',
        show: 'animated slideInUp',
        content: "<div><i class='fa fa-check' style='margin:auto;'></i></div>" +
                     "<div><p style='margin:auto;'>" + message + "</p></div>" +
                     "<div><i class='fa fa-remove'></i></div>",
        callback: function (panel) {
            this.content.css({
                display: 'flex',
                color: 'darkgreen'
            });
            $('div:first-of-type', this.content).css({
                borderRadius: '50%',
                display: 'flex',
                fontSize: '36px',
                margin: '12px',
                width: '60px'
            });
            $('div', this.content).eq(1).css({
                display: 'flex',
                fontSize: '16px',
                textAlign: 'center',
                width: 'calc(100% - 126px)'
            });
            $('div', this.content).eq(2).css({
                display: 'flex',
                flexDirection: 'row-reverse',
                alignItems: 'flex-start',
                fontSize: '18px',
                width: '45px',
                padding: '4px'
            });
            $('div', this.content).eq(2).find('i').css({
                cursor: 'pointer'
            }).click(function () { panel.close(); });
        }
    });
}
function calculateRemainingBodyHeight() {
    // Calculation based on content in Layout.cshtml
    return $(window).height() -
        $("#menuBar").outerHeight(true) -
        $("#pageWrapper").paddingHeight() -
        $("#pageContentWrapper").paddingHeight() -
        $("#pageHeader").outerHeight(true) - 90;
}

function hubConnected() {
    hideErrorMessage();

    if (hubIsConnecting)
        showInfoMessage("Reconnected to service.");

    hubIsConnecting = false;
    hubIsConnected = true;

    // Re-enable hub dependent controls
    updateHubDependentControlState(true);

    // Raise "hubConnected" event
    $(document).trigger("hubConnected");
}

function updateHubDependentControlState(enabled) {
    // This only controls style - not enabled element state
    if (enabled)
        $("[hub-dependent]").removeClass("disabled");
    else
        $("[hub-dependent]").addClass("disabled");
}

// Useful to call when dynamic data-binding adds new controls
function refreshHubDependentControlState() {
    updateHubDependentControlState(hubIsConnected);
}

function startHubConnection() {
    $.connection.hub.start().done(function () {
        hubConnected();
    }).fail(function (err) {
        if (!err || !err.context)
            return;

        if (err.context.status === 401)
            window.location.reload();
    });
}

$(function () {
    // Apply initial content-fill-height styles
    $("[content-fill-height]").addClass("fill-height");

    $(document).on("messageVisibiltyChanged", function (event) {
        const contentWells = $("[content-fill-height]");
        const errorIsVisble = $("#error-msg-block").is(":visible");
        const infoIsVisible = $("#info-msg-block").is(":visible");

        contentWells.removeClass("fill-height fill-height-one-message fill-height-two-messages");

        if (errorIsVisble && infoIsVisible)
            contentWells.addClass("fill-height-two-messages");
        else if (errorIsVisble || infoIsVisible)
            contentWells.addClass("fill-height-one-message");
        else
            contentWells.addClass("fill-height");
    });

    $("#dismissInfoMsg").click(hideInfoMessage);
    $("#dismissErrorMsg").click(hideErrorMessage);

    $("#toggleMenuButton").click(function () {
        toggleSideBar();
    });

    // Prevent clicking on disabled anchors
    $("body").on("click", "a.disabled", function (event) {
        event.preventDefault();
    });

    // Set initial state of hub dependent controls
    updateHubDependentControlState(false);

    // Initialize proxy references to the SignalR hubs
    dataHub = $.connection.dataHub.server;
    dataHubClient = $.connection.dataHub.client;
    sharedHub = $.connection.sharedHub.server;
    sharedHubClient = $.connection.sharedHub.client;

    $.connection.hub.reconnecting(function () {
        hubIsConnecting = true;
        showInfoMessage("Attempting to reconnect to service&nbsp;&nbsp;<span class='glyphicon glyphicon-refresh glyphicon-spin'></span>", -1);

        // Disable hub dependent controls
        updateHubDependentControlState(false);

        // Raise "hubDisconnected" event
        $(document).trigger("hubDisconnected");
    });

    $.connection.hub.reconnected(function () {
        hubConnected();
    });

    $.connection.hub.disconnected(function () {
        hubIsConnected = false;

        if (hubIsConnecting)
            showErrorMessage("Disconnected from server");

        // Disable hub dependent controls
        updateHubDependentControlState(false);

        // Raise "hubDisconnected" event
        $(document).trigger("hubDisconnected");

        setTimeout(startHubConnection, 5000); // Restart connection after 5 seconds
    });

    // Create hub client functions for message control
    function encodeInfoMessage(message, timeout) {
        // Html encode message
        const encodedMessage = $("<div />").text(message).html();
        showInfoMessage(encodedMessage, timeout);
    }

    function encodeErrorMessage(message, timeout) {
        // Html encode message
        const encodedMessage = $("<div />").text(message).html();
        showErrorMessage(encodedMessage, timeout);
    }

    // Register info and error message handlers for each hub client
    dataHubClient.sendInfoMessage = encodeInfoMessage;
    dataHubClient.sendErrorMessage = encodeErrorMessage;
    sharedHubClient.sendInfoMessage = encodeInfoMessage;
    sharedHubClient.sendErrorMessage = encodeErrorMessage;

    // Raise "beforeHubConnected" event - client pages should use
    // this event to register any needed SignalR client functions
    $(window).trigger("beforeHubConnected");

    // Start the connection
    startHubConnection();

    // Enable tool-tips on the page
    $("[data-toggle='tooltip']").tooltip();

    // Keep body vertical scroll bars after nested Bootstrap modal dialogs are closed
    $(document).on("hidden.bs.modal", ".modal", function () {
        $(".modal:visible").length && $(document.body).addClass("modal-open");
    });
});