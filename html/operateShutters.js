var pathname = window.location.href.split("/")[0].split("?")[0];
var baseurl = pathname.concat("cmd/");


var marker;
var config;
var modalCallerIconElement;

GetStartupInfo(true);
$(document).ready(function() {
    resizeDiv();
    setupListeners();
});

window.onresize = function(event) {
    resizeDiv();
}

function resizeDiv() {
    vph = $(window).height();
}

function GetStartupInfo(initMap)
{
    if (initMap == false) {
       $(".loader").addClass("is-active");
    }
    
    url = baseurl.concat("getConfig");
    $.getJSON(  url,
            {},
            function(result, status){
               config = result;
               setupTableShutters();
               if (config.Longitude == 0) {
                   $('#collapseOne').collapse('show');
               } else if (Object.keys(config.Shutters).length == 0){
                   $('.panel-collapse.in').collapse('toggle'); 
                   $('#collapseTwo').collapse('show');
               }
               $(".loader").removeClass("is-active");
            });
}




function sendCommand(shutter, command, resetIcon) {
    var url = baseurl.concat(command);
      $.post(  url,
               {shutter: shutter},
               function(result, status){
                   resetIcon();
                   if ((status=="success") && (result.status == "OK")) {
                   } else {
                      BootstrapDialog.show({type: BootstrapDialog.TYPE_DANGER, title: 'Error', message:'Received Error from Server: '+result.message});
                   }
               }, "json");
}

function addShutter(temp_id, name, duration) {
    var url = baseurl.concat("addShutter");
      $.post(  url,
               {name: name, duration: duration},
               function(result, status){
                   if ((status=="success") && (result.status == "OK")) {
                      $("#shutters tbody tr:last-child").attr('name', result.id);
                      sendCommand(result.id, "program", function() {$('#program-new-shutter').modal('show');})
                   } else {
                      $(modalCallerIconElement).addClass("glyphicon-floppy-save").removeClass("glyphicon-refresh").removeClass("gly-spin");
        	      $(modalCallerIconElement).parents("tr").find(".save, .edit").toggle();
	              $(modalCallerIconElement).parents("tr").find(".delete").show();
                      BootstrapDialog.show({type: BootstrapDialog.TYPE_DANGER, title: 'Error', message:'Received Error from Server: '+result.message, onhide: function(){GetStartupInfo(false);}});
                   }
               }, "json");
}

function editShutter(id, name, duration, resetIcon) {
    var url = baseurl.concat("editShutter");
      $.post(  url,
               {id: id, name: name, duration: duration},
               function(result, status){
                   resetIcon();
                   if ((status=="success") && (result.status == "OK")) {
                      BootstrapDialog.show({type: BootstrapDialog.TYPE_INFO, title: 'Information', message:'Please Note:<br>If you are using the Alexa (Echo Speaker) integration, please read the following carefully.<br><br>Alexa does not allow to automatically rename your device. To rename your device on Alexa, please delete your current device and then ask Alexa to discover new devices.'});
                      GetStartupInfo(false);
                   } else {
                      BootstrapDialog.show({type: BootstrapDialog.TYPE_DANGER, title: 'Error', message:'Received Error from Server: '+result.message, onhide: function(){GetStartupInfo(false);}});
                   }
               }, "json");
}

function programShutter(id) {
    var url = baseurl.concat("program");
      $.post(  url,
               {shutter: id},
               function(result, status){
                   if ((status=="success") && (result.status == "OK")) {
                      BootstrapDialog.show({type: BootstrapDialog.TYPE_INFO, title: 'Information', message:'Program Code has been sent to Shutter.'});
                   } else {
                      BootstrapDialog.show({type: BootstrapDialog.TYPE_DANGER, title: 'Error', message:'Received Error from Server: '+result.message, onhide: function(){GetStartupInfo(false);}});
                   }
               }, "json");
}

function deleteShutter(id) {
    var url = baseurl.concat("deleteShutter");
      $.post(  url,
               {id: id},
               function(result, status){
                   if ((status=="success") && (result.status == "OK")) {
                      GetStartupInfo(false);
                   } else {
                      BootstrapDialog.show({type: BootstrapDialog.TYPE_DANGER, title: 'Error', message:'Received Error from Server: '+result.message, onhide: function(){GetStartupInfo(false);}});
                   }
               }, "json");
}




function setupTableShutters () {
    $("#shutters").find("tr:gt(0)").remove();
    
    var c = 0;
    var shutterIds = Object.keys(config.Shutters);
    shutterIds.sort(function(a, b) { return config.Shutters[a].toLowerCase() > config.Shutters[b].toLowerCase()}).forEach(function(shutter) {
        var row = '<tr name="'+shutter+'" rowtype="existing">' +
                     '<td name="name">'+config.Shutters[shutter]+'</td>' +
                     '<td name="duration">'+config.ShutterDurations[shutter]+'</td>' +
                     '<td class="td-action">' + $("#action_shutters").html() + '</td>' +
                  '</tr>';
        $("#shutters").append(row);

        var cell = '<div class="shutterRemote" name="'+shutter+'">' + 
						'<div class="name">'+config.Shutters[shutter]+'</div>' +
                        '<a class="up btn" title="Up" data-toggle="tooltip" role="button"><img src="up.png"></a>' +
                        '<a class="stop btn" title="Stop" data-toggle="tooltip" role="button"><img src="stop.png"></a>' +
                        '<a class="down btn" title="Down" data-toggle="tooltip" role="button"><img src="down.png"></a>' +
                  '</div>';
        $("#action_manual").append(cell);
        c++;
    });
	
    $("#shuttersCount").text($("#shutters").find('tr').length-1);
	
}


function clockDelayValUpdate(obj) {
   if ($(obj).val() !=  parseInt($(obj).val())){
      $(obj).val(0)
   } else if (parseInt($(obj).val()) > 300) {
      $(obj).val(300)
   } else if (parseInt($(obj).val()) < -300) {
      $(obj).val(-300)
   }
   $(obj).parent().find(".clockDelay").bootstrapSlider('setValue', $(obj).val());
}
    
function setupListeners() {
    $('#locateActions').find('a').on('click', function() { 
        locateUser();
    });

    $('[data-toggle="tooltip"]').tooltip();

    // Append table with add row form on add new button click
    $(".addShutters").click(function(){
	$(this).attr("disabled", "disabled");
        var index = $("#shutters tbody tr:last-child").index();
        var row = '<tr name="newkey_'+index+'" rowtype="new">' +
                      '<td name="name"><input type="text" class="form-control"></td>' +
                      '<td name="duration"><input type="text" class="form-control"></td>' +
   		      '<td class="td-action">' + $("#action_shutters").html() + '</td>' +
                  '</tr>';
    	$("#shutters").append(row);		

	$('#shutters tbody tr').eq(index + 1).find('.save, .edit').toggle();
        $('[data-toggle="tooltip"]').tooltip();
    });

    // Add row on add button click
    $(document).on("click", ".saveShutters", function(){
	var empty = false;
	var input = $(this).parents("tr").find('input[type="text"]');
	thisRow = $(this).parents("tr");

        input.each(function(){
	   if (!$(this).val()){
	       $(this).addClass("error");
	       empty = true;
	   } else {
               $(this).removeClass("error");
           }
        });
        $(this).parents("tr").find(".error").first().focus();
	if(!empty){
           var mydata = {id: $(this).parents("tr").attr('name')}
           var mytype = ($(this).parents("tr").attr("rowtype") == "new") ? "ADD" : "AMEND";
           input.each(function(){
    	      mydata[$(this).parent("td").attr('name')] = $(this).val();
	      $(this).parent("td").html($(this).val());
	   });			

	   $(this).parents("tr").attr("rowtype", "existing")
	   $(".addShutters").removeAttr("disabled");
           $("#shuttersCount").text($("#shutters").find('tr').length-1);
           if (mytype == "ADD") {
              modalCallerIconElement = $(this).find("i");
              $(modalCallerIconElement).toggleClass("glyphicon-floppy-save").toggleClass("glyphicon-refresh").addClass("gly-spin");
              addShutter(mydata.id, mydata.name, mydata.duration);
           } else if (mytype == "AMEND") { 
              var iconElement = $(this).find("i");
              $(iconElement).toggleClass("glyphicon-floppy-save").toggleClass("glyphicon-refresh").addClass("gly-spin");
              editShutter(mydata.id, mydata.name, mydata.duration, function(){
                 $(iconElement).toggleClass("glyphicon-floppy-save").toggleClass("glyphicon-refresh").removeClass("gly-spin")
    	         $(iconElement).parents("tr").find(".save, .edit").toggle();
	         $(iconElement).parents("tr").find(".delete").show();
              });
           }
           
	}		
    });
        

    $(document).on('click', ".shutterAction", function() {
      $(this).parent().find('.shutterAction').toggleClass("inactiveDirection");
    });


    // Edit row on edit button click
    $(document).on("click", ".editShutters", function(){		
        $(this).parents("tr").find("td:not(:last-child)").each(function(){
    	        $(this).html('<input type="text" class="form-control" value="' + $(this).text() + '">');
    	});		
	$(this).parents("tr").find(".save, .edit, .delete").toggle();
	$(".addShutters").attr("disabled", "disabled");
    });

    // Edit row on edit button click
    $(document).on("click", ".programShutters", function(){		
        programShutter($(this).parents("tr").attr('name'));
    });

    $(document).on("click", ".delete", function(){		
        modalCallerIconElement = $(this).find("i");
        $(modalCallerIconElement).toggleClass("glyphicon-trash").toggleClass("glyphicon-refresh").addClass("gly-spin");
    });

    
    $('#confirm-delete').on('hide.bs.modal', function(e) {
        $(modalCallerIconElement).addClass("glyphicon-trash").removeClass("glyphicon-refresh").removeClass("gly-spin");
    }); 
    
    $('#confirm-delete-ok').on("click", function(){
        var tableId = $(modalCallerIconElement).parents("table").attr('id');
        if ($(modalCallerIconElement).parents("tr").find('.edit').is(":visible")) {
             var rowId = $(modalCallerIconElement).parents("tr").attr('name');
             if (tableId == "shutters") {
                 deleteShutter(rowId);
             }
        }
        $('#confirm-delete').modal('hide');
        $("#"+tableId+"Count").text($("#"+tableId).find('tr').length-2);
        $(modalCallerIconElement).parents("tr").remove();
     	$("#add_"+tableId).removeAttr("disabled");
    });


    $('#program-new-shutter').on('hide.bs.modal', function(e) {
        $(modalCallerIconElement).addClass("glyphicon-floppy-save").removeClass("glyphicon-refresh").removeClass("gly-spin");
        $(modalCallerIconElement).parents("tr").find(".save, .edit").toggle();
	$(modalCallerIconElement).parents("tr").find(".delete").show();
        GetStartupInfo(false);
    });


    $('#program-new-shutter-ok').on("click", function(){
        //  We are good, don't do anything. The hide.bs.modal event will take care of refreshing the main window
    });
    $('#program-new-shutter-try').on("click", function(){
        //  Try to programm again
        $('#program-new-shutter-try').text("Sending..")
        sendCommand($("#shutters tbody tr:last-child").attr('name'), "program", function() {$('#program-new-shutter-try').text("Try Programming again")})
    });
    
    $('#program-new-shutter-abort').on("click", function(){
        // Abort, delete the new shutter
        deleteShutter($("#shutters tbody tr:last-child").attr('name'));
        $('#program-new-shutter').modal('hide');
        // The hide.bs.modal event will take care of refreshing the main window
    });

    // Shutter Commands
    $(document).on("click", ".up", function(){		
        var key = $(this).parents("div").attr('name');
        var iconElement = $(this).find("img");
        // $(iconElement).toggleClass("glyphicon-triangle-top").toggleClass("glyphicon-refresh").addClass("gly-spin");
        // sendCommand(key, "up", function(){$(iconElement).toggleClass("glyphicon-triangle-top").toggleClass("glyphicon-refresh").removeClass("gly-spin")});
        $(iconElement).toggleClass("button_transparent");
        sendCommand(key, "up", function(){$(iconElement).toggleClass("button_transparent")});
    });
    $(document).on("click", ".down", function(){		
        var key = $(this).parents("div").attr('name');
        var iconElement = $(this).find("img");
        // $(iconElement).toggleClass("glyphicon-triangle-bottom").toggleClass("glyphicon-refresh").addClass("gly-spin");
        // sendCommand(key, "down", function(){$(iconElement).toggleClass("glyphicon-triangle-bottom").toggleClass("glyphicon-refresh").removeClass("gly-spin")});
        $(iconElement).toggleClass("button_transparent");
        sendCommand(key, "down", function(){$(iconElement).toggleClass("button_transparent")});
    });
    $(document).on("click", ".stop", function(){		
        var key = $(this).parents("div").attr('name');
        var iconElement = $(this).find("img");
        // $(iconElement).toggleClass("glyphicon-minus").toggleClass("glyphicon-refresh").addClass("gly-spin");
        // sendCommand(key, "stop", function(){$(iconElement).toggleClass("glyphicon-minus").toggleClass("glyphicon-refresh").removeClass("gly-spin")});
        $(iconElement).toggleClass("button_transparent");
        sendCommand(key, "stop", function(){$(iconElement).toggleClass("button_transparent")});
    });

}
