'use strict';

/* BLACK SHEEP TOWN / UTAGE IL2CPP text hook.
 *
 * Nothing here depends on a release-specific RVA.  The hook asks IL2CPP for
 * Assembly-CSharp's metadata, resolves the relevant UTAGE methods, and then
 * intercepts the native method pointers it returns.
 */

const PREFIX = '[BST Hook] ';
const installed = [];
let lastPayload = '';

function status(message) {
  send({ type: 'bst-status', message: message });
}

function failure(error) {
  send({
    type: 'bst-error',
    message: String(error && error.stack ? error.stack : error)
  });
}

function readIl2CppString(value) {
  if (!value || value.isNull()) return '';
  const length = value.add(0x10).readS32();
  if (length < 0 || length > 1000000) {
    throw new Error('Invalid IL2CPP string length: ' + length);
  }
  return value.add(0x14).readUtf16String(length) || '';
}

function emitText(kind, speaker, text, scenario) {
  if (!text) return;
  const payload = JSON.stringify([kind, speaker || '', text, scenario || '']);
  if (payload === lastPayload) return;
  lastPayload = payload;
  send({
    type: 'bst-text',
    kind: kind,
    speaker: speaker || '',
    text: text,
    scenario: scenario || ''
  });
}

function findGameAssembly() {
  const names = ['GameAssembly.dll', 'GameAssembly'];
  for (const name of names) {
    const found = Process.findModuleByName(name);
    if (found) return found;
  }
  return null;
}

function installHooks(gameAssembly) {
  function native(name, returnType, argumentTypes) {
    return new NativeFunction(gameAssembly.getExportByName(name), returnType, argumentTypes);
  }

  const domainGet = native('il2cpp_domain_get', 'pointer', []);
  const threadAttach = native('il2cpp_thread_attach', 'pointer', ['pointer']);
  const domainGetAssemblies = native(
    'il2cpp_domain_get_assemblies', 'pointer', ['pointer', 'pointer']
  );
  const assemblyGetImage = native('il2cpp_assembly_get_image', 'pointer', ['pointer']);
  const imageGetName = native('il2cpp_image_get_name', 'pointer', ['pointer']);
  const classFromName = native(
    'il2cpp_class_from_name', 'pointer', ['pointer', 'pointer', 'pointer']
  );
  const classGetMethods = native('il2cpp_class_get_methods', 'pointer', ['pointer', 'pointer']);
  const methodGetName = native('il2cpp_method_get_name', 'pointer', ['pointer']);
  const methodGetParamCount = native('il2cpp_method_get_param_count', 'uint', ['pointer']);
  const methodGetParam = native('il2cpp_method_get_param', 'pointer', ['pointer', 'uint']);
  const typeGetName = native('il2cpp_type_get_name', 'pointer', ['pointer']);

  const domain = domainGet();
  if (domain.isNull()) throw new Error('il2cpp_domain_get returned null');
  threadAttach(domain);

  const countPointer = Memory.alloc(Process.pointerSize);
  countPointer.writePointer(ptr(0));
  const assemblies = domainGetAssemblies(domain, countPointer);
  const count = Process.pointerSize === 8
    ? countPointer.readU64().toNumber()
    : countPointer.readU32();
  let image = NULL;
  for (let index = 0; index < count; index += 1) {
    const assembly = assemblies.add(index * Process.pointerSize).readPointer();
    const candidate = assemblyGetImage(assembly);
    const namePointer = imageGetName(candidate);
    const name = namePointer.isNull() ? '' : namePointer.readCString();
    if (name === 'Assembly-CSharp.dll' || name === 'Assembly-CSharp') {
      image = candidate;
      break;
    }
  }
  if (image.isNull()) throw new Error('Assembly-CSharp.dll was not found');

  function getClass(namespaceName, className) {
    const namespacePointer = Memory.allocUtf8String(namespaceName);
    const classPointer = Memory.allocUtf8String(className);
    const klass = classFromName(image, namespacePointer, classPointer);
    if (klass.isNull()) throw new Error(namespaceName + '.' + className + ' was not found');
    return klass;
  }

  function method(klass, wantedName, wantedCount, wantedFirstParam) {
    const iterator = Memory.alloc(Process.pointerSize);
    iterator.writePointer(NULL);
    while (true) {
      const info = classGetMethods(klass, iterator);
      if (info.isNull()) break;
      const namePointer = methodGetName(info);
      const name = namePointer.isNull() ? '' : namePointer.readCString();
      if (name !== wantedName || methodGetParamCount(info) !== wantedCount) continue;
      if (wantedFirstParam) {
        const type = methodGetParam(info, 0);
        const typeNamePointer = typeGetName(type);
        const typeName = typeNamePointer.isNull() ? '' : typeNamePointer.readCString();
        if (typeName !== wantedFirstParam && !typeName.endsWith('.' + wantedFirstParam)) {
          continue;
        }
      }
      const pointer = info.readPointer();
      if (pointer.isNull()) throw new Error(PREFIX + wantedName + ' has no native pointer');
      return { info: info, pointer: pointer };
    }
    throw new Error(PREFIX + 'method not found: ' + wantedName + '/' + wantedCount);
  }

  function getter(klass, name) {
    const found = method(klass, name, 0, null);
    return {
      info: found.info,
      invoke: new NativeFunction(found.pointer, 'pointer', ['pointer', 'pointer'])
    };
  }

  const pageClass = getClass('Utage', 'AdvPage');
  const textDataClass = getClass('Utage', 'TextData');
  const updatePage = method(pageClass, 'UpdatePageTextData', 1, 'AdvCommandText');
  const pageTextData = getter(pageClass, 'get_TextData');
  const pageNameText = getter(pageClass, 'get_NameText');
  const pageScenario = getter(pageClass, 'get_ScenarioLabel');
  const originalText = getter(textDataClass, 'get_OriginalText');

  Interceptor.attach(updatePage.pointer, {
    onEnter(args) {
      this.page = args[0];
    },
    onLeave() {
      try {
        if (!this.page || this.page.isNull()) return;
        const data = pageTextData.invoke(this.page, pageTextData.info);
        if (data.isNull()) return;
        emitText(
          'dialogue',
          readIl2CppString(pageNameText.invoke(this.page, pageNameText.info)),
          readIl2CppString(originalText.invoke(data, originalText.info)),
          readIl2CppString(pageScenario.invoke(this.page, pageScenario.info))
        );
      } catch (error) {
        failure(error);
      }
    }
  });
  installed.push('dialogue');

  const selectionClass = getClass('Utage', 'AdvSelectionManager');
  const addSelection = method(selectionClass, 'AddSelection', 7, 'System.String');
  Interceptor.attach(addSelection.pointer, {
    onEnter(args) {
      try {
        // Native IL2CPP instance methods receive `this` first.  AddSelection's
        // first declared argument is its jump label, and the second is its text.
        emitText('choice', '', readIl2CppString(args[2]), '');
      } catch (error) {
        failure(error);
      }
    }
  });
  installed.push('choices');

  status('Attached to UTAGE: ' + installed.join(' + '));
}

function boot() {
  const gameAssembly = findGameAssembly();
  if (!gameAssembly) {
    status('Waiting for GameAssembly.dll…');
    const timer = setInterval(function () {
      const candidate = findGameAssembly();
      if (!candidate) return;
      clearInterval(timer);
      try {
        installHooks(candidate);
      } catch (error) {
        failure(error);
      }
    }, 500);
    return;
  }
  try {
    installHooks(gameAssembly);
  } catch (error) {
    failure(error);
  }
}

setImmediate(boot);
