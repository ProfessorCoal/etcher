/*
 * Copyright 2017 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <string>
#include <vector>

#include "os/elevate.h"
#include "utils/v8utils.h"

NAN_METHOD(Elevate) {
  if (!info[0]->IsArray()) {
    return Nan::ThrowError("This function expects an array");
  }

  if (!info[1]->IsFunction()) {
    return Nan::ThrowError("Callback must be a function");
  }

  std::vector<std::string> arguments =
      etcher::v8utils::GetArguments(info[0].As<v8::Array>());
  v8::Local<v8::Function> callback = info[1].As<v8::Function>();

  etcher::ELEVATE_RESULT result = etcher::Elevate(
      arguments.front(),
      std::vector<std::string>(arguments.begin() + 1, arguments.end()));

  // Create results object
  v8::Isolate *isolate = v8::Isolate::GetCurrent();
  v8::Local<v8::Object> results = v8::Object::New(isolate);

  switch (result) {
  case etcher::ELEVATE_RESULT::ELEVATE_SUCCESS:
    results->Set(v8::String::NewFromUtf8(isolate, "cancelled"), Nan::False());
    YIELD_OBJECT(callback, results);
    break;
  case etcher::ELEVATE_RESULT::ELEVATE_CANCELLED:
    results->Set(v8::String::NewFromUtf8(isolate, "cancelled"), Nan::True());
    YIELD_OBJECT(callback, results);
    break;

  case etcher::ELEVATE_RESULT::ELEVATE_FILE_NOT_FOUND:
    YIELD_ERROR(callback, "The specified file was not found");
    break;
  case etcher::ELEVATE_RESULT::ELEVATE_PATH_NOT_FOUND:
    YIELD_ERROR(callback, "The specified path was not found");
    break;
  case etcher::ELEVATE_RESULT::ELEVATE_DDE_FAIL:
    YIELD_ERROR(callback, "The Dynamic Data Exchange (DDE) transaction failed");
    break;
  case etcher::ELEVATE_RESULT::ELEVATE_NO_ASSOCIATION:
    YIELD_ERROR(callback, "There is no application associated with the "
                          "specified file name extension");
    break;
  case etcher::ELEVATE_RESULT::ELEVATE_ACCESS_DENIED:
    YIELD_ERROR(callback, "Access to the specified file is denied");
    break;
  case etcher::ELEVATE_RESULT::ELEVATE_DLL_NOT_FOUND:
    YIELD_ERROR(callback, "One of the library files necessary to run the "
                          "application can't be found");
    break;
  case etcher::ELEVATE_RESULT::ELEVATE_NOT_ENOUGH_MEMORY:
    YIELD_ERROR(callback,
                "There is not enough memory to perform the specified action");
    break;
  case etcher::ELEVATE_RESULT::ELEVATE_SHARING_VIOLATION:
    YIELD_ERROR(callback, "A sharing violation occurred");
    break;
  default:
    YIELD_ERROR(callback, "Unknown error");
  }
}

NAN_MODULE_INIT(ElevatorInit) { NAN_SET_FUNCTION("elevate", Elevate); }

NODE_MODULE(elevator, ElevatorInit)
