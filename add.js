var RECIPE = "recipe";
var RECIPE_INSTS = "insts";
var RECIPE_TAGS = "tags";
var RECIPE_INGREDS = "ingreds";
var RECIPE_INGREDS_NAME = "ingreds-name";
var RI_SPLITTER = "~";
// Initialize Firebase
var config = {
    apiKey: "AIzaSyD6POa6lWU-ZrhoLAQlftw2L3yVTINVGXg"
    , authDomain: "sarojs-kitchen-19571.firebaseapp.com"
    , databaseURL: "https://sarojs-kitchen-19571.firebaseio.com"
    , storageBucket: "sarojs-kitchen-19571.appspot.com"
    , messagingSenderId: "464114918552"
};
firebase.initializeApp(config);
var userInfo;
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
	userInfo = user;
  } else {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
  }
});

// Recipies Display
var recipes = {};
firebase.database().ref('/recipes').on('value',function (snapshot) {
    recipes = snapshot.val();
    $.each(recipes, function (i, v) {
        if(v){
            create(v.name, $(".recipes"), RECIPE,i)    
        }
    });
});

function writeUserData(recipeId, data) {
    if(data && userInfo){
        data["author"] = userInfo.displayName;    
    }
    if (recipeId) {
        recipes[recipeId] = data;
        firebase.database().ref('recipes/' + recipeId).set(data);
    }
    else {
        var newPostKey = firebase.database().ref().child('recipes').push().key;
        // Write the new post's data simultaneously in the posts list and the user's post list.
        var updates = {};
        updates['/recipes/' + newPostKey] = data;
        firebase.database().ref().update(updates);
    }
}
$(document).on("click", "." + RECIPE + ".edit", function () {
    var parent = $(this).closest("li");
    var recipeIndex = parent.attr("index");
    var recipe = recipes[recipeIndex];
    $("a[href='#add-new']").trigger("click");
    $("#submit").attr("recipe-id", recipeIndex).html("Update");
    fillRecipe(recipe);
});
$(document).on("click", "."+RECIPE+".delete", function () {
    var parent = $(this).closest("li");
    var recipeIndex = parent.attr("index");
    writeUserData(recipeIndex, null);
    parent.remove();
});
$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    var target = $(e.target).attr("href") // activated tab
	$(".alert").html('');
	$(".form-control-warning").removeClass("form-control-warning")
    $(".has-warning").removeClass("has-warning");
    if (target == "#add-new") {
        $("#submit").removeAttr("recipe-id").html("ADD");
        fillRecipe();
    }
});

function fillRecipe(recipe) {
    if(recipe){
         if(recipe["ingred"]){
            recipe[RECIPE_INGREDS] = recipe["ingred"];
            delete recipe["ingred"];
        }

        if(recipe["inst"]){
            recipe[RECIPE_INSTS] = recipe["inst"];
            delete recipe["inst"];
        }
        for (var key in recipe) {
            if (recipe.hasOwnProperty(key)) {
                if ($("[name='" + key + "']").length != 0) {
					var value = recipe[key];
					if(key == "youtube"){
						value = value.replace("https://www.youtube.com/embed/","");
					}
                    $("[name='" + key + "']").val(value);
                }
                else if (key == RECIPE_INGREDS || key == RECIPE_INSTS) {
                    var parent = $("ul[for='" + key + "']");
                    for (var ing in recipe[key]) {
                        var value = key == RECIPE_INGREDS ? recipe[key][ing].value + RI_SPLITTER + recipe[key][ing].name : recipe[key][ing];
                        create(value, parent, key);
                    }
                }
                else {
                    console.error("Unhandled " + key);
                }
            }
        }
    }else{
        $("input,textarea").val('');
        $("ul[for]").html('');
    }
    
    var ingredsNameObject = localStorage[RECIPE_INGREDS_NAME];
    if (ingredsNameObject) {
        var ingredsName = JSON.parse(ingredsNameObject).ingreds;
        $.each(ingredsName, function (i, v) {
            $("#ingreds-name-list").append("<option value='" + v + "'>");
        });
    }
}

function create(value, parent, oClass,index) {
    var span = editDeleteIcon(oClass);
    $("<li>").addClass("list-group-item justify-content-between").attr("index",index).html(value).appendTo(parent).append(span);
}

function update(value, parent, oClass, index) {
    var span = editDeleteIcon(oClass);
    var li = $("<li>").addClass("list-group-item justify-content-between").html(value).append(span);
    parent.find("li:eq(" + index + ")").replaceWith(li);
}

function editDeleteIcon(oClass) {
    var remove = $("<i>").addClass("material-icons delete " + oClass).html("delete");
    var edit = $("<i>").addClass("material-icons edit " + oClass).css({
        "margin-right": "20px"
    }).html("edit");
    return $("<span>").append(edit).append(remove);
}

function checkAvail(parent, value) {
    var isAvail = true;
    parent.find("li").each(function (i, v) {
        if ($(this).text() == value) {
            $(this).addClass("list-group-item-info");
            setTimeout(function () {
                $(".list-group-item-info").removeClass("list-group-item-info");
            }, 5000);
            isAvail = false;
            return false;
        }
    });
    return isAvail;
}
//Add new Page
$("#" + RECIPE_INSTS).keypress(function (e) {
    if (e.which == 13) {
        var value = $(this).val().trim();
        var parent = $("ul[for='" + RECIPE_INSTS + "']");
        var index = $(this).attr("index");
        if (index) {
            update(value, parent, RECIPE_INSTS, index);
            $(this).removeAttr("index").val('');
        }
        else {
            if (checkAvail(parent, value)) {
                create(value, parent, RECIPE_INSTS);
                $(this).val('');
            }
        }
    }
});
$("#" + RECIPE_INGREDS + "-name,#"+RECIPE_INGREDS+"-value").keypress(function (e) {
    if (e.which == 13) {
        var iVal = $("#"+RECIPE_INGREDS+"-value").val().trim();
        var iName = $("#"+RECIPE_INGREDS+"-name").val().trim();
        if (!iVal || !iName) {
            $("input[id^=" + RECIPE_INGREDS + "]").filter(function() {
                return !this.value;
            }).addClass("form-control-warning");
            $(this).closest(".form-inline").addClass("has-warning");
            return;
        }
        else {
            $("input[id^=" + RECIPE_INGREDS + "]").removeClass("form-control-warning");
            $(this).closest(".form-inline").removeClass("has-warning");
        }
        var value = iVal + RI_SPLITTER + iName;
        var parent = $("ul[for='" + RECIPE_INGREDS + "']");
        var index = $(this).attr("index");
        if (index) {
            update(value, parent, RECIPE_INGREDS, index);
            $("input[id^=" + RECIPE_INGREDS + "]").removeAttr("index").val('');
        }
        else {
            if (checkAvail(parent, value)) {
                create(value, parent, RECIPE_INGREDS);
                $("input[id^=" + RECIPE_INGREDS + "]").val('');
            }
        }
    }
});
$(document).on("click", ".delete:not(." + RECIPE + ")", function () {
    $(this).closest("li").remove();
});
$(document).on("click", ".edit:not(." + RECIPE + ")", function () {
    var parent = $(this).closest("li");
    parent.addClass("list-group-item-warning");
    var id = parent.closest("ul").attr("for");
    var index = parent.index();
    var value = parent.clone()    //clone the element
                .children() //select all the children
                .remove()   //remove all the children
                .end()  //again go back to selected element
                .text();
    if (id == RECIPE_INGREDS) {
        $("#" + id + "-value").val(value.split(RI_SPLITTER)[0]).attr("index", index);
        $("#" + id + "-name").val(value.split(RI_SPLITTER)[1]).attr("index", index);
    }
    else {
        $("#" + id).val(value).attr("index", index);
    }
});

$(document).on("click","#submit",function(){
    $(".alert").html('').removeClass("alert-warning").removeClass("alert-success");
    $(".form-control-warning").removeClass("form-control-warning")
    $(".has-warning").removeClass("has-warning");
    var isError = false;
    var data = {};
    $("form input:not(#" + RECIPE_INGREDS + "-name,#" + RECIPE_INGREDS + "-value,#" + RECIPE_INSTS + ",#" + RECIPE_TAGS + "),form textarea:not(#output)").each(function (i, v) {
        var value = $(this).val().trim();
		if($(this).attr("name") == "youtube" && value.indexOf("https://www.youtube.com/") == -1){
			value = "https://www.youtube.com/embed/"+value;
		}
        if (value) {
            data[$(this).attr("name")] = value;
        }
        else {
            isError = true;
            $(this).addClass("form-control-warning").closest(".form-group").addClass("has-warning");
            $(".alert").html('<strong>Warning</strong> Recipe '+$(this).attr("name")+' is missing!!').addClass("alert-warning");
        }
    });
    data[RECIPE_TAGS] = [];
    $.each($("#" + RECIPE_TAGS).val().split(","), function (i, v) {
        data[RECIPE_TAGS].push(v);
    });
    data[RECIPE_INSTS] = [];
    $("ul[for='" + RECIPE_INSTS + "'] li").each(function (i, v) {
        data[RECIPE_INSTS].push($(this).clone()    //clone the element
                .children() //select all the children
                .remove()   //remove all the children
                .end()  //again go back to selected element
                .text().replace("editdelete",""));
    });
    data[RECIPE_INGREDS] = [];
    data[RECIPE_INGREDS_NAME] = [];
    $("ul[for='" + RECIPE_INGREDS + "'] li").each(function (i, v) {
		var text = $(this).clone()    //clone the element
                .children() //select all the children
                .remove()   //remove all the children
                .end()  //again go back to selected element
                .text()
        var value = text.split(RI_SPLITTER)[0].trim();
        var name = text.split(RI_SPLITTER)[1].trim();
        data[RECIPE_INGREDS_NAME].push(name);
        data[RECIPE_INGREDS].push({
            "name": name.replace("editdelete","")
            , "value": value
        });
    });
    if (!isError) {
        $(".alert").html('<strong>Good Job!</strong> Recipe is updated successfully').addClass("alert-success");
    }
    updateLocalStorage(data)
    $("#output").val(JSON.stringify(data)).addClass("form-control-success").closest(".form-group").addClass("has-success");
    writeUserData($(this).attr("recipe-id"), data);
});

function updateLocalStorage(data) {
    if (!localStorage[RECIPE_INGREDS_NAME]) {
        localStorage[RECIPE_INGREDS_NAME] = JSON.stringify({
            "ingreds": []
        });
    }
    var ingreds = JSON.parse(localStorage[RECIPE_INGREDS_NAME]).ingreds;
    for (var key in data[RECIPE_INGREDS_NAME]) {
        if (ingreds.indexOf(data[RECIPE_INGREDS_NAME][key]) == -1) {
            ingreds.push(data[RECIPE_INGREDS_NAME][key]);
        }
    }
    localStorage[RECIPE_INGREDS_NAME] = JSON.stringify({
        "ingreds": ingreds
    });
    delete data[RECIPE_INGREDS_NAME];
}